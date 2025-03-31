import { Component, Input } from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { DeviceWithState } from '../device.service';

@Component({
  selector: 'app-device-list-item',
  imports: [MatCardModule, MatSlideToggleModule, MatSliderModule, MatIconModule, CommonModule],
  templateUrl: './device-list-item.component.html',
  styleUrl: './device-list-item.component.scss',
})
export class DeviceListItemComponent {
  @Input() deviceWithState: DeviceWithState = {} as DeviceWithState;
  @Input() isSelected = false;
}
