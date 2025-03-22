import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

declare global {
  interface Window {
    electronAPI: {
      sendMessage: (message: string) => void;
    };
  }
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'wled-desktop';
  sendMessage() {
    window.electronAPI.sendMessage('Hello from Angular!');
  }
}
