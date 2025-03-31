import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDeviceAddComponent } from './dialog-device-add.component';

describe('DialogDeviceAddComponent', () => {
  let component: DialogDeviceAddComponent;
  let fixture: ComponentFixture<DialogDeviceAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogDeviceAddComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogDeviceAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
