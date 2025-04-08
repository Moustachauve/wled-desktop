import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDeviceDeleteComponent } from './dialog-device-delete.component';

describe('DialogDeviceDeleteComponent', () => {
  let component: DialogDeviceDeleteComponent;
  let fixture: ComponentFixture<DialogDeviceDeleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogDeviceDeleteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogDeviceDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
