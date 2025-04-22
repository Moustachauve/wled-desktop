import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, computed, inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { DeviceDetailsComponent } from '../device-details/device-details.component';
import { DeviceEditComponent } from '../device-edit/device-edit.component';
import { DeviceListComponent } from '../device-list/device-list.component';
import { DeviceService } from '../device.service';
import { DialogDeviceAddComponent } from '../dialog-device-add/dialog-device-add.component';
import { LogoComponentComponent } from '../logo-component/logo-component.component';

import { author, bugs, homepage, name, version } from '../../../package.json';
import { DeviceWithState } from '../../lib/websocket-client';

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
    MatSlideToggleModule,
    DeviceListComponent,
    DeviceDetailsComponent,
    RouterLink,
    LogoComponentComponent,
    DeviceEditComponent,
  ],
})
export class NavigationComponent {
  appName = name;
  appVersion = version;
  appHomepage = homepage;
  appBugsUrl = bugs.url;
  appAuthor = author;

  private breakpointObserver = inject(BreakpointObserver);
  readonly dialog = inject(MatDialog);
  @ViewChild('editWindow') editWindow!: MatSidenav;
  selectedDeviceWithState: DeviceWithState | undefined;

  showHiddenDevices = computed(() => this.deviceService.showHiddenDevices());
  showHiddenDevicesLabel = computed(() =>
    this.showHiddenDevices() ? 'Hide hidden devices' : 'Show hidden devices'
  );
  showHiddenDevicesIcon = computed(() =>
    this.showHiddenDevices() ? 'visibility_off' : 'visibility'
  );

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(private deviceService: DeviceService) {}

  openAddDeviceDialog() {
    this.dialog.open(DialogDeviceAddComponent);
  }

  setSelectedDevice(deviceWithState: DeviceWithState | null) {
    console.log('setSelectedDevice', deviceWithState);
    this.selectedDeviceWithState = deviceWithState ?? undefined;

    if (this.selectedDeviceWithState == undefined) {
      this.editWindow.close();
    }
  }

  toggleShowHiddenDevices() {
    this.deviceService.showHiddenDevices.update(showHidden => !showHidden);
  }
}
