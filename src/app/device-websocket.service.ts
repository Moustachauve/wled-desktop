import { Injectable, OnDestroy, signal, WritableSignal } from '@angular/core';
import {
  distinctUntilChanged,
  map,
  Observable,
  scan,
  shareReplay,
  Subject,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { Device } from '../lib/database/device';
import { DeviceStateInfo } from '../lib/device-api-types';
import { WebsocketClient } from '../lib/websocket-client';
import { DeviceService } from './device.service';

export interface DeviceWebsocketState {
  macAddress: string;
  isConnected: boolean;
  stateInfo?: DeviceStateInfo; // Last known state from WebSocket
}

export class DeviceWithState {
  public readonly device!: Device;
  public stateInfo: WritableSignal<DeviceStateInfo | null> = signal(null);
  public isWebsocketConnected = signal(false);

  constructor(device: Device) {
    this.device = device;
  }

  displayName() {
    return this.device.customName || this.device.originalName || '(New Device)';
  }
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

      // Prevent scan recalculation if the device list content hasn't effectively changed
      distinctUntilChanged((prevMap, currMap) => {
        if (prevMap.size !== currMap.size) return false;
        for (const key of currMap.keys()) {
          console.log('comparing map and stuff');
          if (!prevMap.has(key)) return false;
          // TODO: Add deeper comparison if device properties relevant to WS
          // connection might have changed. e.g.,
          // if (prevMap.get(key)?.address !== currMap.get(key)?.address) return false;
        }
        return true;
      }),

      // Use scan to manage the lifecycle of WebsocketClients
      scan((currentClientsMap, newDevicesMap) => {
        const nextClientsMap = new Map<string, WebsocketClient>(
          currentClientsMap
        ); // Start with current map
        const currentIds = new Set(currentClientsMap.keys());
        const newIds = new Set(newDevicesMap.keys());

        // console.log("[Scan] Current IDs:", currentIds, "New IDs:", newIds);

        // 1. Identify and destroy clients for removed devices
        currentIds.forEach(id => {
          if (!newIds.has(id)) {
            console.log(`[Scan] Device removed: ${id}. Destroying client.`);
            const websocketClient = nextClientsMap.get(id);
            websocketClient?.destroy(); // Trigger client cleanup
            nextClientsMap.delete(id); // Remove from the map for the next state
          }
        });

        // 2. Identify and create/connect clients for added devices
        newIds.forEach(id => {
          if (!currentIds.has(id)) {
            console.log(`[Scan] Device added: ${id}. Creating client.`);
            const device = newDevicesMap.get(id)!; // Device must exist here
            const newClient = new WebsocketClient(device);
            newClient.connect();
            nextClientsMap.set(id, newClient); // Add to the map
          }
          // Optional: Handle device updates (e.g., IP address change)
          // else {
          //    const existingManaged = nextClientsMap.get(id)!;
          //    const newDeviceData = newDevicesMap.get(id)!;
          //    if (existingManaged.device.address !== newDeviceData.address) {
          //        console.log(`[Scan] Device address changed for ${id}. Recreating client.`);
          //        existingManaged.client.destroy(); // Destroy old one
          //        const newClient = new WebsocketClient(newDeviceData); // Create new
          //        newClient.connect();
          //        nextClientsMap.set(id, { client: newClient, device: newDeviceData }); // Update map entry
          //    }
          // }
        });

        // Return the updated map which becomes the accumulator for the next emission
        return nextClientsMap;
      }, new Map<string, WebsocketClient>()), // Initial value for scan: empty map

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
      // Optional: Prevent emitting identical arrays (shallow check)
      distinctUntilChanged(
        (prev, curr) =>
          prev.length === curr.length && prev.every((p, i) => p === curr[i])
      ),
      // Ensure this stream also cleans up
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
