import { Injectable, OnDestroy } from '@angular/core';
import {
  map,
  Observable,
  scan,
  shareReplay,
  Subject,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { DeviceStateInfo } from '../lib/device-api-types';
import { DeviceWithState, WebsocketClient } from '../lib/websocket-client';
import { DeviceService } from './device.service';

export interface DeviceWebsocketState {
  macAddress: string;
  isConnected: boolean;
  stateInfo?: DeviceStateInfo; // Last known state from WebSocket
}

@Injectable({
  providedIn: 'root',
})
export class DeviceWebsocketService implements OnDestroy {
  private activeClientsMap$: Observable<Map<string, WebsocketClient>>;
  public devicesWithState$: Observable<DeviceWithState[]>;
  // Signal to trigger cleanup of all streams on service destroy
  private serviceDestroy$ = new Subject<void>();

  constructor(private deviceService: DeviceService) {
    // Create the stream that manages the clients list
    this.activeClientsMap$ = this.deviceService.devices$.pipe(
      // Map devices array to Map<macAddress, Device> for efficient lookup
      map(devices => new Map(devices.map(d => [d.macAddress, d]))),

      // Use scan to maintain and manage the state of active WebSocket connections.
      // It compares the latest device list (newDevicesMap) with the previously known
      // active clients (currentClientsMap, the accumulator).
      // This allows us to:
      //   1. Detect when devices are removed and destroy their corresponding
      //      WebSocket clients.
      //   2. Detect when new devices are added and create/connect new WebSocket
      //      clients.
      //   3. (Future/Optional) Detect changes in existing devices (like IP
      //      address) and potentially recreate clients.
      // The output of scan is the updated map of active WebsocketClients.
      scan((currentClientsMap, newDevicesMap) => {
        // Create a mutable copy of the current client map to build the next
        // state. We start with a copy of the current client map to prevent
        // recreating existing clients.
        const nextClientsMap = new Map<string, WebsocketClient>(
          currentClientsMap
        );
        const currentIds = new Set(currentClientsMap.keys());
        const newIds = new Set(newDevicesMap.keys());

        // 1. Identify and destroy clients for devices that are no longer present
        currentIds.forEach(id => {
          if (!newIds.has(id)) {
            console.log(`[Scan] Device removed: ${id}. Destroying client.`);
            const websocketClient = nextClientsMap.get(id);
            websocketClient?.destroy(); // Ensure proper cleanup within the client
            nextClientsMap.delete(id); // Remove from the map for the next emission
          }
        });

        // 2. Identify and create/connect clients for added devices
        newIds.forEach(id => {
          if (!currentIds.has(id)) {
            // If the device exists in the new list but not in the previous one,
            // then it is a new device. Add it to the list of clients.
            console.log(`[Scan] Device added: ${id}. Creating client.`);
            const device = newDevicesMap.get(id)!; // Device must exist here
            const newClient = new WebsocketClient(device);
            newClient.connect();
            nextClientsMap.set(id, newClient);
          } else {
            // If the device exists in both lists, check if it needs to be updated.
            const existingClient = nextClientsMap.get(id)!;
            const newDeviceData = newDevicesMap.get(id)!;
            if (existingClient.device.address !== newDeviceData.address) {
              console.log(
                `[Scan] Device address changed for ${id}. Recreating client.`
              );
              existingClient.destroy(); // Destroy old one
              const newClient = new WebsocketClient(newDeviceData); // Create new
              newClient.connect();
              nextClientsMap.set(id, newClient); // Update map entry
            }
          }
        });

        // Return the updated map, which becomes the 'currentClientsMap' for the next iteration
        return nextClientsMap;
      }, new Map<string, WebsocketClient>()), // Initial state for scan is an empty map

      tap(clientMap =>
        console.log(`[Scan Output] Active clients: ${clientMap.size}`)
      ),

      // Ensure scan stops managing clients when the service is destroyed
      takeUntil(this.serviceDestroy$),

      // Share the map observable:
      // - Avoids re-running scan for multiple subscribers.
      // - Keeps the connection management active as long as there's at least one subscriber.
      // - Replays the latest map to new subscribers.
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.devicesWithState$ = this.activeClientsMap$.pipe(
      // Map the Map<string, ManagedClient> to DeviceWithState[]
      map(clientsMap => {
        return Array.from(clientsMap.values()).map(managed => managed.state);
      }),
      // Ensure scan stops managing clients when the service is destroyed
      takeUntil(this.serviceDestroy$),
      // Share the final result array
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  ngOnDestroy() {
    console.log('DeviceWebsocketService Destroying...');
    this.serviceDestroy$.next();
    this.serviceDestroy$.complete();
  }

  sendMessage(macAddress: string, message: object) {
    this.activeClientsMap$.pipe(take(1)).subscribe(map => {
      const managedClient = map.get(macAddress);
      if (managedClient) {
        managedClient.sendMessage(message);
      } else {
        console.warn(
          `[SendMessage] No active client found for device ${macAddress}`
        );
      }
    });
  }

  togglePower(on: boolean, macAddress: string) {
    this.sendMessage(macAddress, { on: on });
  }

  setBrightness(brightness: number, macAddress: string) {
    this.sendMessage(macAddress, { bri: brightness });
  }
}
