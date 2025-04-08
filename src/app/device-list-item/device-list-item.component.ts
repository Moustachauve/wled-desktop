import { Component, Input, OnDestroy, OnInit, output } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { DeviceService, DeviceWithState } from '../device.service';
import { DeviceInfoTwoRowsComponent } from "../device-info-two-rows/device-info-two-rows.component";

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
    DeviceInfoTwoRowsComponent
],
  templateUrl: './device-list-item.component.html',
  styleUrl: './device-list-item.component.scss',
})
export class DeviceListItemComponent implements OnInit, OnDestroy {
  @Input() deviceWithState: DeviceWithState = {} as DeviceWithState;
  @Input() isSelected = false;
  @Input() showCheckbox = false;
  deviceChecked = output<boolean>();

  brightness = 0;
  private brightnessSubject = new Subject<number>();
  private destroy$ = new Subject<void>();

  constructor(private deviceService: DeviceService) {}

  ngOnInit(): void {
    this.brightnessSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(brightness => {
        this.deviceService.setBrightness(
          brightness,
          this.deviceWithState.device.macAddress
        );
      });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSwitch(isChecked: boolean) {
    console.log('toggleSwitch:', isChecked);
    this.deviceService.togglePower(
      isChecked,
      this.deviceWithState.device.macAddress
    );
  }

  onBrightnessInput(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.value !== null) {
      this.brightness = parseInt(target.value, 10);
      this.brightnessSubject.next(this.brightness);
    }
  }

  onDeviceChecked(isChecked: boolean) {
    this.deviceChecked.emit(isChecked);
  }

  getConnectionClass() {
    return this.deviceWithState.isWebsocketConnected
      ? 'connected'
      : 'disconnected';
  }

  getConnectionTooltip() {
    return this.deviceWithState.isWebsocketConnected
      ? 'Connected to device'
      : 'Not connected to device';
  }
}
