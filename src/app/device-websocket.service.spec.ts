import { TestBed } from '@angular/core/testing';

import { DeviceWebsocketService } from './device-websocket.service';

describe('DeviceWebsocketService', () => {
  let service: DeviceWebsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceWebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
