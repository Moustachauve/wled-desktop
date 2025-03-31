import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DeviceListItemComponent } from '../device-list-item/device-list-item.component';
import { DeviceService, DeviceWithState } from '../device.service';

@Component({
  selector: 'app-device-list-details',
  imports: [MatListModule, DeviceListItemComponent, CommonModule],
  templateUrl: './device-list-details.component.html',
  styleUrl: './device-list-details.component.scss',
})
export class DeviceListDetailsComponent implements OnInit {
  devicesWithState: DeviceWithState[] = [];
  selectedDeviceWithState: DeviceWithState | null = null;
  selectedDeviceAddress: SafeResourceUrl | null = null;

  constructor(
    private deviceService: DeviceService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.getDevices();
  }

  getDevices() {
    this.deviceService.devicesWithState$.subscribe(devicesWithState => {
      this.devicesWithState = devicesWithState;
    });
  }

  setSelectedDevice(deviceWithState: DeviceWithState) {
    this.selectedDeviceWithState = deviceWithState;
    this.selectedDeviceAddress = this.sanitizer.bypassSecurityTrustResourceUrl('http://' + deviceWithState.device.address);
    console.log(this.selectedDeviceAddress);
  }
}
