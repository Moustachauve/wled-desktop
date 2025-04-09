import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { DeviceDetailsComponent } from '../device-details/device-details.component';
import { DeviceListComponent } from '../device-list/device-list.component';
import { DeviceWithState } from '../device.service';
import { DialogDeviceAddComponent } from '../dialog-device-add/dialog-device-add.component';
import { LogoComponentComponent } from "../logo-component/logo-component.component";

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
    LogoComponentComponent
],
})
export class NavigationComponent {
  private breakpointObserver = inject(BreakpointObserver);
  readonly dialog = inject(MatDialog);
  selectedDeviceWithState: DeviceWithState | undefined;

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  openAddDeviceDialog() {
    this.dialog.open(DialogDeviceAddComponent);
  }

  setSelectedDevice(deviceWithState: DeviceWithState) {
    this.selectedDeviceWithState = deviceWithState;
  }
}
