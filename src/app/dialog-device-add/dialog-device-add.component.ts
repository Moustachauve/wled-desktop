import { Component, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DeviceFirstContactService } from '../device-first-contact.service';
import { MatIconModule } from '@angular/material/icon';
import { Device } from '../../lib/database/device';
import { DeviceWithState } from '../device.service';

enum AddStep {
  Form = 1,
  Adding = 2,
  Success = 3,
}

@Component({
  selector: 'app-dialog-device-add',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './dialog-device-add.component.html',
  styleUrl: './dialog-device-add.component.scss',
})
export class DialogDeviceAddComponent {
  readonly dialogRef = inject(MatDialogRef<DialogDeviceAddComponent>);

  urlValidator: ValidatorFn = (control: AbstractControl) => {
    let validUrl = true;

    try {
      new URL('http://' + control.value.trim() + '/json/info');
    } catch {
      validUrl = false;
    }
    return validUrl ? null : { invalidUrl: true };
  };
  deviceAddForm = new FormGroup({
    address: new FormControl('', Validators.compose([Validators.required, this.urlValidator])),
  });
  address = '';
  errorMessage = '';
  AddStep = AddStep;
  currentStep = AddStep.Form;
  deviceWithState: DeviceWithState | undefined;

  constructor(private deviceFirstContactService: DeviceFirstContactService) {}

  get addressField() {
    return this.deviceAddForm.get('address');
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  /**
   * Handles form submit for adding a device
   */
  onSubmitAddDevice() {
    if (this.deviceAddForm.invalid) {
      return;
    }
    if (this.deviceAddForm.value.address) {
      console.log('submit!');
      this.addDevice(this.deviceAddForm.value.address.trim());
    }
  }

  /**
   * Tries adding a new device after submitting the form
   * @param address address of the device to add
   */
  private async addDevice(address: string) {
    this.address = address;
    this.currentStep = AddStep.Adding;
    try {
      this.deviceWithState = await this.deviceFirstContactService.tryCreateDevice(address);
    } catch (error) {
      this.errorMessage = 'Could not add device.';
      console.error(error);
      this.currentStep = AddStep.Form;
      return;
    }
    this.currentStep = AddStep.Success;
  }
}
