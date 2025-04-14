import {
  booleanAttribute,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DeviceInfoTwoRowsComponent } from '../device-info-two-rows/device-info-two-rows.component';
import { DeviceService, DeviceWithState } from '../device.service';

@Component({
  selector: 'app-device-list-item',
  imports: [
    MatCardModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatIconModule,
    CommonModule,
    FormsModule,
    MatTooltipModule,
    MatCheckboxModule,
    DeviceInfoTwoRowsComponent,
  ],
  templateUrl: './device-list-item.component.html',
  styleUrl: './device-list-item.component.scss',
})
export class DeviceListItemComponent {
  deviceWithState = input({} as DeviceWithState);
  isSelected = input(false, { transform: booleanAttribute });
  showCheckbox = input(false, { transform: booleanAttribute });
  deviceChecked = output<boolean>();

  brightness = model(0);

  connectionClass = computed(() =>
    this.deviceWithState().isWebsocketConnected ? 'connected' : 'disconnected'
  );

  connectionTooltip = computed(() =>
    this.deviceWithState().isWebsocketConnected
      ? 'Connected to device'
      : 'Not connected to device'
  );

  constructor(private deviceService: DeviceService) {
    toObservable(this.brightness)
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(brightness => {
        this.deviceService.setBrightness(
          brightness,
          this.deviceWithState().device.macAddress
        );
      });
  }

  toggleSwitch(isChecked: boolean) {
    console.log('toggleSwitch:', isChecked);
    this.deviceService.togglePower(
      isChecked,
      this.deviceWithState().device.macAddress
    );
  }

  onDeviceChecked(isChecked: boolean) {
    this.deviceChecked.emit(isChecked);
  }
}
