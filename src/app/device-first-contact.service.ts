import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { plainToInstance } from 'class-transformer';
import { Observable, firstValueFrom } from 'rxjs';
import { db } from '../lib/database/db';
import { Device } from '../lib/database/device';
import { DeviceStateInfo, Info } from '../lib/device-api-types';
import { DeviceWithState } from './device.service';

@Injectable({
  providedIn: 'root',
})
export class DeviceFirstContactService {
  constructor(private http: HttpClient) {
    this.listenToElectronDiscovery();
  }

  async tryCreateDevice(address: string): Promise<DeviceWithState> {
    console.log(address, 'Trying to create a new device');
    const plainInfo = await firstValueFrom(this.getDeviceInfo(address));
    console.log(address, plainInfo);
    const info = plainToInstance(Info, plainInfo);
    console.log(address, plainInfo);
    if (!info.macAddress) {
      throw Error('No mac address returned');
    }
    const device: Device = {
      macAddress: info.macAddress,
      address: address,
    };
    db.devices.put(device);
    console.log(address, 'Device created');
    const deviceWithState = new DeviceWithState(device);
    deviceWithState.stateInfo = plainToInstance(DeviceStateInfo, {
      info: plainInfo,
    });
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
      this.tryCreateDevice(ipAddress);
    });
  }
}
