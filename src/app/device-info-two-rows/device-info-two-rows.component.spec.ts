import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceInfoTwoRowsComponent } from './device-info-two-rows.component';

describe('DeviceInfoTwoRowsComponent', () => {
  let component: DeviceInfoTwoRowsComponent;
  let fixture: ComponentFixture<DeviceInfoTwoRowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceInfoTwoRowsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeviceInfoTwoRowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
