import { Component, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { DeviceListItemComponent } from '../device-list-item/device-list-item.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    AsyncPipe,
    DeviceListItemComponent,
    MatSlideToggleModule,
  ],
})
export class NavigationComponent {
  private breakpointObserver = inject(BreakpointObserver);

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(result => result.matches),
    shareReplay()
  );

  device1 = {
    name: 'First WLED',
    address: '192.168.1.101',
    macAddress: '00:00:00:00:00:00',
    isPoweredOn: false,
    brightness: 128,
  };
  device2 = {
    name: 'WLED Second',
    address: '192.168.1.102',
    macAddress: '11:11:11:11:11:11',
    isPoweredOn: true,
    brightness: 10,
  };

  allDevices = [this.device1, this.device2];
}
