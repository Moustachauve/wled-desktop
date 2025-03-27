import { Component } from '@angular/core';
import { db } from '../../lib/database/db';
import { liveQuery } from 'dexie';
import { AsyncPipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { DeviceListItemComponent } from '../device-list-item/device-list-item.component';

@Component({
  selector: 'app-device-list-details',
  imports: [AsyncPipe, MatListModule, DeviceListItemComponent],
  templateUrl: './device-list-details.component.html',
  styleUrl: './device-list-details.component.scss',
})
export class DeviceListDetailsComponent {
  allDevices$ = liveQuery(() => db.devices.toArray());
}
