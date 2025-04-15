export interface Device {
  macAddress: string;
  address: string;
  isHidden: boolean;
  originalName?: string;
  customName?: string;
}
