import { CommonModule } from '@angular/common';
import { Component, computed, Input } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { DomSanitizer } from '@angular/platform-browser';
import { DeviceInfoTwoRowsComponent } from '../device-info-two-rows/device-info-two-rows.component';
import { DeviceWithState } from '../device.service';

@Component({
  selector: 'app-device-details',
  imports: [CommonModule, MatToolbar, DeviceInfoTwoRowsComponent],
  templateUrl: './device-details.component.html',
  styleUrl: './device-details.component.scss',
})
export class DeviceDetailsComponent {
  @Input() deviceWithState: DeviceWithState = {} as DeviceWithState;
  selectedDeviceAddress = computed(() => {
    if (this.deviceWithState) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        'http://' + this.deviceWithState.device.address
      );
    }
    return undefined;
  });

  constructor(private sanitizer: DomSanitizer) {}
}
