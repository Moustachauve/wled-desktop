import { Injectable } from '@angular/core';
import { db } from '../lib/database/db';
import { Device } from '../lib/database/device';
import { liveQuery, Observable } from 'dexie';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  getDevices(): Observable<Device[]> {
    return liveQuery(() => db.devices.toArray());
  }
}
