import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DeviceFirstContactService } from './device-first-contact.service';
import { NavigationComponent } from './navigation/navigation.component';

declare global {
  interface Window {
    electron: {
      onDeviceDiscovered: (callback: (ipAddress: string) => void) => void;
    };
  }
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'WLED';

  constructor(private deviceFirstContactService: DeviceFirstContactService) {}
}
