import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DeviceWithState } from '../device.service';

@Component({
  selector: 'app-device-edit',
  imports: [
    MatCardModule,
    MatToolbarModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatInputModule,
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './device-edit.component.html',
  styleUrl: './device-edit.component.scss',
})
export class DeviceEditComponent {
  @Input() get deviceWithState(): DeviceWithState | undefined {
    return this._deviceWithState;
  }
  set deviceWithState(deviceWithState: DeviceWithState | undefined) {
    this._deviceWithState = deviceWithState;
    this.updateForm();
  }
  private _deviceWithState?: DeviceWithState;

  customName = new FormControl('');
  isVisible = new FormControl(true);
  updateChannel = new FormControl(0);

  updateForm() {
    this.customName.setValue(this.deviceWithState?.device.customName ?? null);
    // TODO: add visibility support
    this.isVisible.setValue(false);
    // TODO: add update channel support
    this.updateChannel.setValue(0);
  }
}
