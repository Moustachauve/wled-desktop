import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { db } from '../lib/database/db';
import { Device } from '../lib/database/device';
import { DeviceStateInfo, ParseDeviceJsonState } from '../lib/device-api-types';
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
  private deviceWebsockets: Record<string, WebSocket> = {};
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
          this.deviceWebsockets[macAddress].close();
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
    let ws: WebSocket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5; // Adjust as needed
    const reconnectDelay = 15000; // Adjust delay in milliseconds

    console.log(
      `Initiating WebSocket connection for device ${device.macAddress}...`
    );

    const connect = () => {
      ws = new WebSocket(websocketUrl);

      ws.onopen = () => {
        console.log(
          `WebSocket connected to device ${device.macAddress}:${device.address}`
        );
        this.deviceWebsockets[device.macAddress] = ws;
        this.devicesWithState[device.macAddress].isWebsocketConnected = true;
        reconnectAttempts = 0; // Reset attempts on successful connection
        this.publishDevicesWithState();
      };

      ws.onmessage = event => {
        const deviceState = ParseDeviceJsonState(event.data);
        this.devicesWithState[device.macAddress].stateInfo = deviceState;

        // Update stored device state
        // TODO: Should be extracted to its own function probably or done better.
        this.devicesWithState[device.macAddress].device.originalName =
          deviceState?.info.name;
        db.devices.update(
          device.macAddress,
          this.devicesWithState[device.macAddress].device
        );

        console.log(
          'onmessage',
          device.macAddress,
          this.devicesWithState[device.macAddress].stateInfo
        );
        this.publishDevicesWithState();
      };

      ws.onclose = () => {
        console.log(`WebSocket closed for device ${device.macAddress}`);
        delete this.deviceWebsockets[device.macAddress];
        if (this.devicesWithState[device.macAddress]) {
          this.devicesWithState[device.macAddress].isWebsocketConnected = false;
        }
        this.publishDevicesWithState();
        // Only try to reconnect if the device is still in the list of devicesWithState
        if (this.devicesWithState[device.macAddress]) {
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(
              `Attempting reconnection to ${device.macAddress} in ${reconnectDelay}ms...` +
                ` (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`
            );
            setTimeout(connect, reconnectDelay);
          } else {
            console.error(
              `Max reconnection attempts reached for ${device.macAddress}.`
            );
          }
        } else {
          console.log(
            `Won't reconnect to ${device.macAddress}, it's no longer in the list.`
          );
        }
      };

      ws.onerror = error => {
        this.devicesWithState[device.macAddress].isWebsocketConnected = false;
        this.publishDevicesWithState();
        console.error(
          `WebSocket error for device ${device.macAddress}:`,
          error
        );
      };
    };

    connect(); // Initiate the initial connection
  }

  sendMessage(macAddress: string, message: object) {
    if (!macAddress || !this.deviceWebsockets[macAddress]) return;

    this.deviceWebsockets[macAddress].send(JSON.stringify(message));
  }

  closeAllWebsockets() {
    Object.values(this.deviceWebsockets).forEach(ws => {
      ws.close();
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
