import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  output,
  signal,
  Signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SimplebarAngularModule } from 'simplebar-angular';
import { DeviceWithState } from '../../lib/websocket-client';
import { DeviceListItemComponent } from '../device-list-item/device-list-item.component';
import { DeviceWebsocketService } from '../device-websocket.service';
import { DeviceService } from '../device.service';
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
export class DeviceListComponent {
  deviceSelected = output<DeviceWithState | null>();
  openAddDeviceDialog = output();
  openSidebarMenu = output();

  // Inject services
  private deviceService = inject(DeviceService);
  private deviceWebsocketService = inject(DeviceWebsocketService);
  readonly dialog = inject(MatDialog);

  selectedDeviceWithState: DeviceWithState | null = null;

  private readonly rawDevicesWithState = toSignal(
    this.deviceWebsocketService.devicesWithState$,
    { initialValue: [] } // Provide an initial value
  );
  readonly devicesWithState: Signal<DeviceWithState[]> = computed(() => {
    // Get the latest value from the source signal
    const devices = this.rawDevicesWithState();

    // Create a shallow copy and sort it
    return [...devices].sort((a, b) => {
      const connectedA = a.isWebsocketConnected();
      const connectedB = b.isWebsocketConnected();

      // Prioritize connected devices
      if (connectedA && !connectedB) {
        return -1;
      } else if (!connectedA && connectedB) {
        return 1;
      } else {
        // If connection status is the same, sort by display name
        // Ensure displayName() reads the latest name from the device object
        return a.displayName().localeCompare(b.displayName());
      }
    });
  });

  // TODO: make showCheckbox observe checkedDevices so that it is updated
  // automatically
  private checkedDevices = signal<DeviceWithState[]>([]);
  readonly showCheckbox = computed(() => this.checkedDevices().length > 0);

  onOpenSideBarMenu() {
    this.openSidebarMenu.emit();
  }

  onOpenAddDeviceDialog() {
    this.openAddDeviceDialog.emit();
  }

  onOpenDeleteDevicesDialog() {
    const devicesToDelete = this.checkedDevices();
    // Should not happen if button is enabled correctly
    if (devicesToDelete.length === 0) return;

    const dialogRef = this.dialog.open(DialogDeviceDeleteComponent, {
      data: devicesToDelete,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Check if the currently selected device was deleted
        const selectedMac = this.selectedDeviceWithState?.device.macAddress;
        const selectedDeviceWasDeleted = devicesToDelete.some(
          d => d.device.macAddress === selectedMac
        );
        if (selectedDeviceWasDeleted) {
          this.setSelectedDevice(null);
        }

        // Delete devices from the service
        this.deviceService.deleteDevices(
          devicesToDelete.map(dws => dws.device)
        );
        // Reset checkbox state
        this.checkedDevices.set([]);
      }
    });
  }

  setSelectedDevice(deviceWithState: DeviceWithState | null) {
    this.selectedDeviceWithState = deviceWithState;
    this.deviceSelected.emit(deviceWithState);
  }

  onDeviceChecked(deviceWithState: DeviceWithState, isChecked: boolean) {
    this.checkedDevices.update(currentChecked => {
      if (isChecked) {
        // Add if not already present
        return currentChecked.includes(deviceWithState)
          ? currentChecked
          : [...currentChecked, deviceWithState];
      } else {
        // Remove
        return currentChecked.filter(
          checkedDevice => checkedDevice !== deviceWithState
        );
      }
    });
  }
}
