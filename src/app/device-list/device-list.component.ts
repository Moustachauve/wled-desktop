import { CommonModule } from '@angular/common';
import { Component, OnInit, output } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DeviceListItemComponent } from '../device-list-item/device-list-item.component';
import { DeviceService, DeviceWithState } from '../device.service';

@Component({
  selector: 'app-device-list',
  imports: [MatListModule, DeviceListItemComponent, CommonModule],
  templateUrl: './device-list.component.html',
  styleUrl: './device-list.component.scss',
})
export class DeviceListComponent implements OnInit {
  devicesWithState: DeviceWithState[] = [];
  selectedDeviceWithState: DeviceWithState | null = null;
  selectedDeviceAddress: SafeResourceUrl | null = null;

  deviceSelected = output<DeviceWithState>();

  showCheckbox = false;
  private checkedDevices: DeviceWithState[] = [];

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
    this.selectedDeviceAddress = this.sanitizer.bypassSecurityTrustResourceUrl(
      'http://' + deviceWithState.device.address
    );
    this.deviceSelected.emit(deviceWithState);
    console.log(this.selectedDeviceAddress);
  }

  onDeviceChecked(deviceWithState: DeviceWithState, isChecked: boolean) {
    if (isChecked) {
      this.checkedDevices.push(deviceWithState);
    } else {
      this.checkedDevices = this.checkedDevices.filter(
        checkedDevice => checkedDevice !== deviceWithState
      );
    }
    this.showCheckbox = this.checkedDevices.length > 0;
  }
}
