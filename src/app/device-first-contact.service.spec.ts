import { TestBed } from '@angular/core/testing';

import { DeviceFirstContactService } from './device-first-contact.service';

describe('DeviceFirstContactService', () => {
  let service: DeviceFirstContactService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceFirstContactService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
