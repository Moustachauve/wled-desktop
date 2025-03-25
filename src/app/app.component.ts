import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';

declare global {
  interface Window {
    electronAPI: {
      sendMessage: (message: string) => void;
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

  sendMessage() {
    window.electronAPI.sendMessage('Hello from Angular!');
  }
}
