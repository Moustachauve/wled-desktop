// db.ts
import Dexie, { Table } from 'dexie';
import { Device } from './device';

export class AppDB extends Dexie {
  devices!: Table<Device, string>;

  constructor() {
    super('wled-desktop');
    this.version(1).stores({
      devices: '&macAddress, address', // TODO: id should be macAddress, non incremental
    });
    this.on('populate', () => this.populate());
  }

  async populate() {
    /*
    await db.devices.add({
      macAddress: '11:22:33:44:55:66',
      address: '192.168.1.2',
      name: 'test WLED',
    });
    */
  }
}

export const db = new AppDB();
