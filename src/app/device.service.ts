import { Injectable, OnDestroy } from '@angular/core';
import { Observable as DexieObservable, liveQuery, Subscription } from 'dexie';
import { Observable, Subject } from 'rxjs';
import { db } from '../lib/database/db';
import { Device } from '../lib/database/device';
import { DeviceStateInfo, ParseDeviceJsonState } from '../lib/device-api-types';

export class DeviceWithState {
  device!: Device;
  stateInfo: DeviceStateInfo | null = null;
  isWebsocketConnected = false;

  constructor(device: Device) {
    this.device = device;
  }

  displayName() {
    return this.device.name ?? this.stateInfo?.info.name ?? '(New Device)';
  }
}

@Injectable({
  providedIn: 'root',
})
export class DeviceService implements OnDestroy {
  devices: Device[] = [];
  private deviceWebsockets: Record<string, WebSocket> = {};
  private websocketMessages: Record<string, any[]> = {};
  private deviceChangesSubscription: Subscription | undefined;
  private devices$: DexieObservable<Device[]>;
  private devicesWithState: Record<string, DeviceWithState> = {};
  private devicesWithStateSubject = new Subject<DeviceWithState[]>();
  devicesWithState$: Observable<DeviceWithState[]> = this.devicesWithStateSubject.asObservable();

  constructor() {
    this.devices$ = liveQuery(() => db.devices.toArray());
    this.deviceChangesSubscription = this.devices$.subscribe(devices => {
      // TODO: update devices in deviceWithState here too
      this.devices = devices;
      this.syncDevicesWithState();
      this.manageWebsockets();
    });
  }

  ngOnDestroy() {
    if (this.deviceChangesSubscription) {
      this.deviceChangesSubscription.unsubscribe();
    }
    this.closeAllWebsockets();
  }

  manageWebsockets() {
    const currentMacAddresses = this.devices.map(device => device.macAddress);

    // Close websockets for removed devices
    Object.keys(this.deviceWebsockets)
      .filter(macAddress => !currentMacAddresses.includes(macAddress))
      .forEach(macAddress => {
        if (this.deviceWebsockets[macAddress]) {
          this.deviceWebsockets[macAddress].close();
          delete this.deviceWebsockets[macAddress];
          delete this.websocketMessages[macAddress];
          delete this.devicesWithState[macAddress];
        }
      });

    // Open websockets for new or existing devices
    this.devices.forEach(device => {
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

    console.log(`Initiating WebSocket connection for device ${device.macAddress}...`);

    const connect = () => {
      ws = new WebSocket(websocketUrl);

      ws.onopen = () => {
        console.log(`WebSocket connected to device ${device.macAddress}`);
        this.deviceWebsockets[device.macAddress] = ws;
        this.websocketMessages[device.macAddress] = [];
        this.devicesWithState[device.macAddress].isWebsocketConnected = true;
        reconnectAttempts = 0; // Reset attempts on successful connection
        this.publishDevicesWithState();
      };

      ws.onmessage = event => {
        console.log(device.macAddress, event.data);
        const message = JSON.parse(event.data);
        if (!this.websocketMessages[device.macAddress]) {
          this.websocketMessages[device.macAddress] = [];
        }
        this.websocketMessages[device.macAddress].push(message);
        this.devicesWithState[device.macAddress].stateInfo = ParseDeviceJsonState(event.data);
        console.log(device.macAddress, this.devicesWithState[device.macAddress].stateInfo);
        this.publishDevicesWithState();
      };

      ws.onclose = () => {
        console.log(`WebSocket closed for device ${device.macAddress}`);
        delete this.deviceWebsockets[device.macAddress];
        this.devicesWithState[device.macAddress].isWebsocketConnected = false;
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(
            `Attempting reconnection to ${device.macAddress} in ${reconnectDelay}ms... (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`
          );
          setTimeout(connect, reconnectDelay);
        } else {
          console.error(`Max reconnection attempts reached for ${device.macAddress}.`);
        }
        this.publishDevicesWithState();
      };

      ws.onerror = error => {
        console.error(`WebSocket error for device ${device.macAddress}:`, error);
      };
    };

    connect(); // Initiate the initial connection
  }

  sendMessage(macAddress: string, message: string) {
    if (!macAddress || !this.deviceWebsockets[macAddress]) return;

    this.deviceWebsockets[macAddress].send(JSON.stringify({ message }));
  }

  closeAllWebsockets() {
    Object.values(this.deviceWebsockets).forEach(ws => {
      ws.close();
    });
    this.deviceWebsockets = {};
    this.devicesWithState = {};
    this.websocketMessages = {};
  }

  getMessages(macAddress: string) {
    return this.websocketMessages[macAddress];
  }

  async addDevice(device: Device) {
    await db.devices.put(device); // Use put for macAddress as primary key
  }

  async removeDevice(macAddress: string) {
    await db.devices.delete(macAddress);
  }

  /**
   * Sync the DevicesWithState map with the device list. This makes sure each
   * devices have an entry in devicesWithState and that the device object itself
   * is kept to date
   *
   * This should be call anytime a change is made to the list of devices.
   */
  private syncDevicesWithState() {
    // Make sure the device object itself is up to date.
    this.devices.forEach(device => {
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
}
