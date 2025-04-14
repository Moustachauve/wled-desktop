import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SimplebarAngularModule } from 'simplebar-angular';
import { DeviceListItemComponent } from '../device-list-item/device-list-item.component';
import { DeviceService, DeviceWithState } from '../device.service';
import { DialogDeviceDeleteComponent } from '../dialog-device-delete/dialog-device-delete.component';
import { LogoComponentComponent } from '../logo-component/logo-component.component';

@Component({
  selector: 'app-device-list',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatListModule,
    DeviceListItemComponent,
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    LogoComponentComponent,
    SimplebarAngularModule,
  ],
  templateUrl: './device-list.component.html',
  styleUrl: './device-list.component.scss',
})
export class DeviceListComponent implements OnInit {
  deviceSelected = output<DeviceWithState | null>();
  openAddDeviceDialog = output();
  openSidebarMenu = output();

  devicesWithState: DeviceWithState[] = [];
  selectedDeviceWithState: DeviceWithState | null = null;

  readonly dialog = inject(MatDialog);

  showCheckbox = false;
  private checkedDevices: DeviceWithState[] = [];

  constructor(private deviceService: DeviceService) {}

  ngOnInit() {
    this.getDevices();
  }

  onOpenSideBarMenu() {
    this.openSidebarMenu.emit();
  }

  onOpenAddDeviceDialog() {
    this.openAddDeviceDialog.emit();
  }

  onOpenDeleteDevicesDialog() {
    const dialogRef = this.dialog.open(DialogDeviceDeleteComponent, {
      data: this.checkedDevices,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        for (const device of this.checkedDevices) {
          // If we just deleted the selected device, make sure to unselect it.
          if (
            device.device.macAddress ==
            this.selectedDeviceWithState?.device.macAddress
          ) {
            this.setSelectedDevice(null);
            break;
          }
        }
        this.deviceService.deleteDevices(this.checkedDevices);
      }
    });
  }

  getDevices() {
    this.deviceService.devicesWithState$.subscribe(devicesWithState => {
      this.devicesWithState = devicesWithState;
    });
  }

  setSelectedDevice(deviceWithState: DeviceWithState | null) {
    this.selectedDeviceWithState = deviceWithState;
    this.deviceSelected.emit(deviceWithState);
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
