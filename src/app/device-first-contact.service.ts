import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { plainToInstance } from 'class-transformer';
import { Observable, firstValueFrom } from 'rxjs';
import { db } from '../lib/database/db';
import { Device } from '../lib/database/device';
import { DeviceStateInfo, Info } from '../lib/device-api-types';
import { DeviceWithState } from './device-websocket.service';

@Injectable({
  providedIn: 'root',
})
export class DeviceFirstContactService {
  constructor(private http: HttpClient) {
    this.listenToElectronDiscovery();
  }

  /**
   * Creates a new device record in the database.
   * Assumes the device does not already exist.
   * @param macAddress - The unique MAC address for the new device.
   * @param address - The network address (e.g., IP) for the new device.
   * @returns The newly created device object.
   */
  private async _createDevice(
    macAddress: string,
    address: string
  ): Promise<Device> {
    console.log(
      `Creating new device entry for MAC: ${macAddress} at address: ${address}`
    );
    const device: Device = {
      macAddress: macAddress,
      address: address,
      isHidden: false,
      // Add other default properties if needed
    };
    await db.devices.put(device);
    console.log(`Device created for MAC: ${macAddress}`);
    return device;
  }

  /**
   * Updates the address of an existing device record in the database.
   * @param device - The existing device object to update.
   * @param newAddress - The new network address for the device.
   * @returns The updated device object.
   */
  private async _updateDeviceAddress(
    device: Device,
    newAddress: string
  ): Promise<Device> {
    console.log(
      `Updating address for device MAC: ${device.macAddress} to ${newAddress}`
    );
    device.address = newAddress;
    await db.devices.put(device); // Assumes put handles updates based on the primary key (macAddress)
    console.log(`Device address updated for MAC: ${device.macAddress}`);
    return device;
  }

  /**
   * Fetches device information using its address, then ensures a corresponding
   * device record exists in the database (creating or updating its address
   * as necessary). Returns the device combined with its latest state info.
   *
   * @param address - The network address (e.g., IP) to query.
   * @returns A Promise resolving to the device (from DB) with its current state info.
   * @throws Error if device info cannot be fetched or lacks a MAC address.
   */
  async fetchAndUpsertDevice(address: string): Promise<DeviceWithState> {
    console.log(address, 'Trying to create a new device');
    const plainInfo = await firstValueFrom(this.getDeviceInfo(address));
    const info = plainToInstance(Info, plainInfo);
    if (!info.macAddress) {
      console.error(
        `Could not retrieve MAC address for device at ${address}. Response:`,
        plainInfo
      );
      throw new Error(
        `Could not retrieve MAC address for device at ${address}. See console for details.`
      );
    }
    const macAddress = info.macAddress;

    // Check Database and Create/Update
    let device: Device;
    const existingDevice = await db.devices.get(macAddress);

    if (existingDevice) {
      console.log(`Device found for MAC: ${macAddress}`);
      // Check if the address needs updating
      if (existingDevice.address !== address) {
        device = await this._updateDeviceAddress(existingDevice, address);
      } else {
        console.log(
          `Device address (${address}) is already up-to-date for MAC: ${macAddress}`
        );
        device = existingDevice; // No update needed, use existing data
      }
    } else {
      console.log(
        `No existing device found for MAC: ${macAddress}. Creating new entry.`
      );
      device = await this._createDevice(macAddress, address);
    }

    // 3. Combine DB record with State Info
    const deviceWithState = new DeviceWithState(device);
    deviceWithState.stateInfo.set(
      plainToInstance(DeviceStateInfo, {
        info: plainInfo,
      })
    );

    console.log(`Successfully processed device for address: ${address}`);
    return deviceWithState;
  }

  private getDeviceInfo(address: string): Observable<Info> {
    return this.http.get<Info>('http://' + address + '/json/info');
  }

  private listenToElectronDiscovery() {
    if (!window.electron) {
      console.log('Discovery is not available');
      return;
    }
    console.log('Listening to electron discovery');
    window.electron.onDeviceDiscovered(ipAddress => {
      console.log('Potential device discovered', ipAddress);
      this.fetchAndUpsertDevice(ipAddress);
    });
  }
}
