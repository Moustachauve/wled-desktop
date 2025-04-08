import { Component, Input } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeviceWithState } from '../device.service';

@Component({
  selector: 'app-device-info-two-rows',
  imports: [
    MatCardModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatIconModule,
    CommonModule,
    FormsModule,
    MatTooltipModule,
    MatCheckboxModule,
  ],
  templateUrl: './device-info-two-rows.component.html',
  styleUrl: './device-info-two-rows.component.scss',
})
export class DeviceInfoTwoRowsComponent {
  @Input() deviceWithState: DeviceWithState = {} as DeviceWithState;
}
