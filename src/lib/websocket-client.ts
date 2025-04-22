import { signal, WritableSignal } from '@angular/core';
import { plainToInstance } from 'class-transformer';
import {
  catchError,
  EMPTY,
  finalize,
  Observable,
  retry,
  Subject,
  Subscription,
  timer,
} from 'rxjs';
import {
  webSocket,
  WebSocketSubject,
  WebSocketSubjectConfig,
} from 'rxjs/webSocket';
import { db } from './database/db';
import { Device } from './database/device';
import { DeviceStateInfo } from './device-api-types';

const MAX_RECONNECTION_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000; // 5 seconds, with exponential backoff

export class DeviceWithState {
  public readonly device!: Device;
  public stateInfo: WritableSignal<DeviceStateInfo | null> = signal(null);
  public isWebsocketConnected = signal(false);

  constructor(device: Device) {
    this.device = device;
  }

  displayName() {
    return this.device.customName || this.device.originalName || '(New Device)';
  }
}

export class WebsocketClient {
  private webSocket$: WebSocketSubject<object> | null = null;
  private readonly messages$: Observable<unknown>;
  private connectionSubscription: Subscription | null = null;

  // Publicly expose the state container
  public readonly state: DeviceWithState;

  // Use Subject to signal cleanup internally
  private destroySignal$ = new Subject<void>();

  constructor(private device: Device) {
    this.state = new DeviceWithState(device);
    const websocketUrl = `ws://${this.device.address}/ws`;

    const wsConfig: WebSocketSubjectConfig<object> = {
      url: websocketUrl,
      openObserver: {
        next: () => {
          console.log(
            `[WS Client ${this.state.device.macAddress}] WebSocket connected`
          );
          this.state.isWebsocketConnected.set(true);
        },
      },
      closeObserver: {
        next: closeEvent => {
          console.log(
            `[WS Client ${this.state.device.macAddress}] WebSocket closed. Code: ${closeEvent.code}`
          );
          this.state.isWebsocketConnected.set(false);
        },
      },
    };

    this.webSocket$ = webSocket(wsConfig);
    this.messages$ = this.webSocket$.pipe(
      // Use exponential backoff to retry connecting to the device
      retry({
        count: MAX_RECONNECTION_ATTEMPTS,
        delay: (_error, retryIndex) => {
          const interval = RECONNECT_DELAY;
          // Double the interval each time it fails to connect
          const delay = Math.pow(2, retryIndex - 1) * interval;
          console.log('retrying connection...', _error, retryIndex);
          return timer(delay);
        },
      }),
      catchError(error => {
        console.error(
          `[WS Client ${this.state.device.macAddress}] Failed permanently after retries:`,
          error?.message || error
        );
        this.state.isWebsocketConnected.set(false);
        // Don't re-throw; complete the stream gracefully for this client
        return EMPTY;
      }),
      finalize(() => {
        // Runs on complete, error, or unsubscribe (implicitly via takeUntil)
        console.log(
          `[WS Client ${this.state.device.macAddress}] Finalizing message stream.`
        );
        this.state.isWebsocketConnected.set(false);
        this.webSocket$ = null; // Clean up subject reference
      })
    );
    // Do NOT subscribe here. Connection triggered externally by `connect()`.
  }
  connect() {
    if (this.connectionSubscription || this.destroySignal$.isStopped) {
      console.warn(
        `[WS Client ${this.state.device.macAddress}] Already connected or destroyed.`
      );
      return;
    }
    this.connectionSubscription = this.messages$.subscribe({
      next: message => {
        console.log('onmessage', this.device.macAddress, message);
        const deviceState = plainToInstance(DeviceStateInfo, message);
        console.log('parsedMessage', deviceState);
        this.state.stateInfo.set(deviceState);

        // Update stored device state
        this.state.isWebsocketConnected.set(true);
        // TODO: Should be extracted to its own function probably or done better.
        this.state.device.originalName = deviceState?.info.name;
        db.devices.update(this.device.macAddress, this.state.device);
      },
      error: error => {
        this.state.isWebsocketConnected.set(false);
        console.error(
          `WebSocket error for device ${this.device.macAddress}:`,
          error
        );
      },
      complete: () => {
        console.log(`WebSocket closed for device ${this.device.macAddress}`);
        //delete webSocket$;
        this.state.isWebsocketConnected.set(false);
      },
    });
  }

  sendMessage(message: object): boolean {
    if (this.webSocket$ && !this.webSocket$.closed) {
      try {
        this.webSocket$.next(message);
        return true;
      } catch (e) {
        console.error(
          `[WS Client ${this.state.device.macAddress}] Error sending data:`,
          e
        );
        return false;
      }
    } else {
      console.warn(
        `[WS Client ${this.state.device.macAddress}] Cannot send data, WebSocket not open or client destroyed.`
      );
      return false;
    }
  }

  destroy() {
    if (this.destroySignal$.isStopped) {
      return;
    }
    this.destroySignal$.next();
    this.destroySignal$.complete();

    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
      this.connectionSubscription = null;
    }

    if (this.webSocket$) {
      // Use complete for graceful close, unsubscribe for immediate teardown
      this.webSocket$.complete();
      this.webSocket$ = null;
    }
  }
}
