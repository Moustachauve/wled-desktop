import { Injectable, OnDestroy } from '@angular/core';
import { plainToInstance } from 'class-transformer';
import { Observable, retry, Subject, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { db } from '../lib/database/db';
import { Device } from '../lib/database/device';
import { DeviceStateInfo } from '../lib/device-api-types';
import { DeviceService } from './device.service';

export interface DeviceWebsocketState {
  macAddress: string;
  isConnected: boolean;
  stateInfo?: DeviceStateInfo; // Last known state from WebSocket
}

export class DeviceWithState {
  device!: Device;
  stateInfo: DeviceStateInfo | null = null;
  isWebsocketConnected = false;

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
  private deviceWebsockets: Record<string, WebSocketSubject<unknown>> = {};
  private devicesWithState: Record<string, DeviceWithState> = {};
  private devicesWithStateSubject = new Subject<DeviceWithState[]>();

  devicesWithState$: Observable<DeviceWithState[]> =
    this.devicesWithStateSubject.asObservable();

  constructor(private deviceService: DeviceService) {
    this.deviceService.devices$.subscribe(devices => {
      console.log('Devices changed:', devices);
      this.syncDevicesWithState(devices);
      this.manageWebsockets(devices);
    });
  }

  ngOnDestroy() {
    this.closeAllWebsockets();
  }

  manageWebsockets(devices: Device[]) {
    const currentMacAddresses = devices.map(device => device.macAddress);

    // Close websockets for removed devices
    Object.keys(this.deviceWebsockets)
      .filter(macAddress => !currentMacAddresses.includes(macAddress))
      .forEach(macAddress => {
        if (this.deviceWebsockets[macAddress]) {
          this.deviceWebsockets[macAddress].complete();
          delete this.deviceWebsockets[macAddress];
          delete this.devicesWithState[macAddress];
        }
      });

    // Open websockets for new or existing devices
    devices.forEach(device => {
      if (!this.deviceWebsockets[device.macAddress]) {
        this.openWebsocket(device);
      }
    });
    this.publishDevicesWithState();
  }

  openWebsocket(device: Device) {
    const websocketUrl = `ws://${device.address}/ws`;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5; // Adjust as needed
    const reconnectDelay = 15000; // Adjust delay in milliseconds

    console.log(
      `Initiating WebSocket connection for device ${device.macAddress}...`
    );

    this.deviceWebsockets[device.macAddress] = webSocket(websocketUrl);

    this.deviceWebsockets[device.macAddress]
      .pipe(
        // Use exponential backoff to retry connecting to the device
        retry({
          count: maxReconnectAttempts,
          delay: (_error, retryIndex) => {
            const interval = reconnectDelay;
            // Double the interval each time it fails to connect
            const delay = Math.pow(2, retryIndex - 1) * interval;
            console.log('retrying connection...', _error, retryIndex);
            return timer(delay);
          },
        })
      )
      .subscribe({
        next: message => {
          console.log('onmessage', device.macAddress, message);
          const deviceState = plainToInstance(DeviceStateInfo, message);
          this.devicesWithState[device.macAddress].stateInfo = deviceState;

          // Update stored device state
          this.devicesWithState[device.macAddress].isWebsocketConnected = true;
          // TODO: Should be extracted to its own function probably or done better.
          this.devicesWithState[device.macAddress].device.originalName =
            deviceState?.info.name;
          db.devices.update(
            device.macAddress,
            this.devicesWithState[device.macAddress].device
          );
          this.publishDevicesWithState();
        },
        error: error => {
          this.devicesWithState[device.macAddress].isWebsocketConnected = false;
          this.publishDevicesWithState();
          console.error(
            `WebSocket error for device ${device.macAddress}:`,
            error
          );
        },
        complete: () => {
          console.log(`WebSocket closed for device ${device.macAddress}`);
          //delete this.deviceWebsockets[device.macAddress];
          if (this.devicesWithState[device.macAddress]) {
            this.devicesWithState[device.macAddress].isWebsocketConnected =
              false;
          }
          this.publishDevicesWithState();
        },
      });
  }

  sendMessage(macAddress: string, message: object) {
    if (!macAddress || !this.deviceWebsockets[macAddress]) return;
    console.log(`Sending message to ${macAddress}:`, message);
    this.deviceWebsockets[macAddress].next(message);
  }

  closeAllWebsockets() {
    Object.values(this.deviceWebsockets).forEach(ws => {
      ws.complete();
    });
    this.deviceWebsockets = {};
    this.devicesWithState = {};
  }

  /**
   * Sync the DevicesWithState map with the device list. This makes sure each
   * devices have an entry in devicesWithState and that the device object itself
   * is kept to date
   *
   * This should be call anytime a change is made to the list of devices.
   */
  private syncDevicesWithState(devices: Device[]) {
    // Make sure the device object itself is up to date.
    devices.forEach(device => {
      if (this.devicesWithState[device.macAddress]) {
        this.devicesWithState[device.macAddress].device = device;
      } else {
        this.devicesWithState[device.macAddress] = new DeviceWithState(device);
      }
    });
    this.publishDevicesWithState();
  }

  /**
   * Publish the list of devices and their state to any subsribers of the
   * observable list. Should be called every time a device or its state are
   * modified.
   */
  private publishDevicesWithState() {
    const deviceWithStateArray = Object.values(this.devicesWithState);
    this.devicesWithStateSubject.next(deviceWithStateArray);
  }

  togglePower(on: boolean, macAddress: string) {
    this.sendMessage(macAddress, { on: on });
  }

  setBrightness(brightness: number, macAddress: string) {
    this.sendMessage(macAddress, { bri: brightness });
  }
}
