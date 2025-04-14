import { CommonModule } from '@angular/common';
import { Component, Input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DeviceInfoTwoRowsComponent } from '../device-info-two-rows/device-info-two-rows.component';
import { DeviceWithState } from '../device.service';
import { LogoComponentComponent } from '../logo-component/logo-component.component';

@Component({
  selector: 'app-device-details',
  imports: [
    CommonModule,
    MatToolbar,
    DeviceInfoTwoRowsComponent,
    LogoComponentComponent,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './device-details.component.html',
  styleUrl: './device-details.component.scss',
})
export class DeviceDetailsComponent {
  @Input() get deviceWithState(): DeviceWithState | undefined {
    return this._deviceWithState;
  }
  set deviceWithState(deviceWithState: DeviceWithState | undefined) {
    this._deviceWithState = deviceWithState;
    if (deviceWithState) {
      this.selectedDeviceAddress =
        this.sanitizer.bypassSecurityTrustResourceUrl(
          'http://' + deviceWithState.device.address
        );
    }
  }
  private _deviceWithState?: DeviceWithState;

  openEditWindow = output();

  selectedDeviceAddress: SafeResourceUrl | undefined;

  constructor(private sanitizer: DomSanitizer) {}

  onOpenEditWindow() {
    this.openEditWindow.emit();
  }
}
