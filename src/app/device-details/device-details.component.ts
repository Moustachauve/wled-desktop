import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { DomSanitizer } from '@angular/platform-browser';
import { DeviceWithState } from '../device.service';

@Component({
  selector: 'app-device-details',
  imports: [CommonModule, MatToolbar],
  templateUrl: './device-details.component.html',
  styleUrl: './device-details.component.scss',
})
export class DeviceDetailsComponent {
  deviceWithState = input<DeviceWithState>();
  selectedDeviceAddress = computed(() => {
    const deviceWithState = this.deviceWithState();
    if (deviceWithState) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        'http://' + deviceWithState.device.address
      );
    }
    return undefined;
  });

  constructor(private sanitizer: DomSanitizer) {}
}
