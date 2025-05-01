import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-https-warning',
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogTitle,
    MatDialogContent,
  ],
  templateUrl: './dialog-https-warning.component.html',
  styleUrl: './dialog-https-warning.component.scss',
})
export class DialogHttpsWarningComponent {
  openUnencryptedPage() {
    window.location.protocol = 'http:';
  }
}
