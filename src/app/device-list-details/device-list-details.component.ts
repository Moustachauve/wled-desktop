import { Component, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { DeviceListItemComponent } from '../device-list-item/device-list-item.component';
import { DeviceService, DeviceWithState } from '../device.service';
import { Device } from '../../lib/database/device';

@Component({
  selector: 'app-device-list-details',
  imports: [MatListModule, DeviceListItemComponent],
  templateUrl: './device-list-details.component.html',
  styleUrl: './device-list-details.component.scss',
})
export class DeviceListDetailsComponent implements OnInit {
  constructor(private deviceService: DeviceService) {}

  ngOnInit() {
    this.getDevices();
  }

  devicesWithState: DeviceWithState[] = [];

  getDevices() {
    this.deviceService.devicesWithState$.subscribe(devicesWithState => {
      this.devicesWithState = devicesWithState;
    });
  }
}
