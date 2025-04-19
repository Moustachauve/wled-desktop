import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { Observable, switchMap } from 'rxjs';
import { db } from '../lib/database/db';
import { Device } from '../lib/database/device';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  devices: Device[] = [];

  devices$: Observable<Device[]>;

  showHiddenDevices = signal(false);

  constructor() {
    const showHidden$ = toObservable(this.showHiddenDevices);

    this.devices$ = showHidden$.pipe(
      switchMap(showHidden =>
        liveQuery(() =>
          db.devices.filter(device => showHidden || !device.isHidden).toArray()
        )
      )
    );
  }

  async addDevice(device: Device) {
    await db.devices.put(device);
  }

  async removeDevice(macAddress: string) {
    await db.devices.delete(macAddress);
  }

  async deleteDevices(devices: Device[]) {
    await db.devices.bulkDelete(devices.map(device => device.macAddress));
  }

  async setCustomName(device: Device, customName?: string) {
    device.customName = customName?.trim() ?? undefined;
    await db.devices.update(device.macAddress, device);
  }

  async setIsHidden(device: Device, isHidden: boolean) {
    device.isHidden = isHidden;
    await db.devices.update(device.macAddress, device);
  }
}
