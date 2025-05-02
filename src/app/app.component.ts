import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterOutlet } from '@angular/router';
import { DeviceFirstContactService } from './device-first-contact.service';
import { DialogHttpsWarningComponent } from './dialog-https-warning/dialog-https-warning.component';

declare global {
  interface Window {
    electron: {
      onDeviceDiscovered: (callback: (ipAddress: string) => void) => void;
    };
  }
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'WLED';

  readonly dialog = inject(MatDialog);
  private deviceFirstContactService = inject(DeviceFirstContactService);

  ngOnInit(): void {
    this.checkForHttps();
  }

  // Check if the user is on HTTPs. Will be used to display a warning if they
  // are. If the user is on electron, do nothing.
  checkForHttps() {
    if (window.electron || window.location.protocol !== 'https:') {
      return;
    }

    this.dialog.open(DialogHttpsWarningComponent, {
      disableClose: true,
    });
  }
}
