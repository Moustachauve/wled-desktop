import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { DeviceWithState } from '../../lib/websocket-client';
import { DeviceInfoTwoRowsComponent } from '../device-info-two-rows/device-info-two-rows.component';

@Component({
  selector: 'app-dialog-device-delete',
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatIconModule,
    DeviceInfoTwoRowsComponent,
  ],
  templateUrl: './dialog-device-delete.component.html',
  styleUrl: './dialog-device-delete.component.scss',
})
export class DialogDeviceDeleteComponent {
  readonly dialogRef = inject(MatDialogRef<DialogDeviceDeleteComponent>);
  readonly deviceList = inject<DeviceWithState[]>(MAT_DIALOG_DATA);
}
