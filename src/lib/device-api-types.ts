import { Expose, Type, plainToInstance } from 'class-transformer';
import 'reflect-metadata';

export function ParseDeviceJsonState(jsonState: string): DeviceStateInfo | null {
  try {
    const json = JSON.parse(jsonState);
    return plainToInstance(DeviceStateInfo, json);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}

export class DeviceStateInfo {
  @Expose({ name: 'state' })
  @Type(() => State)
  state!: State;

  @Expose({ name: 'info' })
  @Type(() => Info)
  info!: Info;
}

export class FileSystem {
  @Expose({ name: 'u' })
  spaceUsed?: number;

  @Expose({ name: 't' })
  spaceTotal?: number;

  @Expose({ name: 'pmt' })
  presetLastModification?: number;
}

export class Info {
  @Expose({ name: 'leds' })
  @Type(() => Leds)
  leds!: Leds;

  @Expose({ name: 'wifi' })
  @Type(() => Wifi)
  wifi!: Wifi;

  @Expose({ name: 'ver' })
  version?: string;

  @Expose({ name: 'vid' })
  buildId?: number;

  @Expose({ name: 'cn' })
  codeName?: string;

  @Expose({ name: 'release' })
  release?: string;

  @Expose({ name: 'name' })
  name!: string;

  @Expose({ name: 'str' })
  syncToggleReceive?: boolean;

  @Expose({ name: 'udpport' })
  udpPort?: number;

  @Expose({ name: 'simplifiedui' })
  simplifiedUI?: boolean;

  @Expose({ name: 'live' })
  isUpdatedLive?: boolean;

  @Expose({ name: 'liveseg' })
  liveSegment?: number;

  @Expose({ name: 'lm' })
  realtimeMode?: string;

  @Expose({ name: 'lip' })
  realtimeIp?: string;

  @Expose({ name: 'ws' })
  websocketClientCount?: number;

  @Expose({ name: 'fxcount' })
  effectCount?: number;

  @Expose({ name: 'palcount' })
  paletteCount?: number;

  @Expose({ name: 'cpalcount' })
  customPaletteCount?: number;

  @Expose({ name: 'fs' })
  @Type(() => FileSystem)
  fileSystem?: FileSystem;

  @Expose({ name: 'ndc' })
  nodeListCount?: number;

  @Expose({ name: 'arch' })
  platformName?: string;

  @Expose({ name: 'core' })
  arduinoCoreVersion?: string;

  @Expose({ name: 'clock' })
  clockFrequency?: number;

  @Expose({ name: 'flash' })
  flashChipSize?: number;

  @Expose({ name: 'lwip' })
  lwip?: number;

  @Expose({ name: 'freeheap' })
  freeHeap?: number;

  @Expose({ name: 'uptime' })
  uptime?: number;

  @Expose({ name: 'time' })
  time?: string;

  @Expose({ name: 'opt' })
  options?: number;

  @Expose({ name: 'brand' })
  brand?: string;

  @Expose({ name: 'product' })
  product?: string;

  @Expose({ name: 'mac' })
  macAddress?: string;

  @Expose({ name: 'ip' })
  ipAddress?: string;
}

export class JsonPost {
  @Expose({ name: 'on' })
  isOn?: boolean;

  @Expose({ name: 'bri' })
  brightness?: number;

  @Expose({ name: 'v' })
  verbose = true;
}

export class Leds {
  @Expose({ name: 'count' })
  count?: number;

  @Expose({ name: 'pwr' })
  estimatedPowerUsed?: number;

  @Expose({ name: 'fps' })
  fps?: number;

  @Expose({ name: 'maxpwr' })
  maxPower?: number;

  @Expose({ name: 'maxseg' })
  maxSegment?: number;
}

export class Nightlight {
  @Expose({ name: 'on' })
  isOn?: boolean;

  @Expose({ name: 'dur' })
  duration?: number;

  @Expose({ name: 'fade' })
  fade?: boolean;

  @Expose({ name: 'mode' })
  mode?: number;

  @Expose({ name: 'tbri' })
  targetBrightness?: number;

  @Expose({ name: 'rem' })
  remainingTime?: number;
}

export class Segment {
  @Expose({ name: 'id' })
  id?: number;

  @Expose({ name: 'start' })
  start?: number;

  @Expose({ name: 'stop' })
  stop?: number;

  @Expose({ name: 'len' })
  length?: number;

  @Expose({ name: 'grp' })
  grouping?: number;

  @Expose({ name: 'spc' })
  spacing?: number;

  @Expose({ name: 'on' })
  isOn?: boolean;

  @Expose({ name: 'bri' })
  brightness?: number;

  @Expose({ name: 'col' })
  colors?: number[][];

  @Expose({ name: 'fx' })
  effect?: number;

  @Expose({ name: 'sx' })
  effectSpeed?: number;

  @Expose({ name: 'ix' })
  effectIntensity?: number;

  @Expose({ name: 'pal' })
  palette?: number;

  @Expose({ name: 'sel' })
  isSelected?: boolean;

  @Expose({ name: 'rev' })
  isReversed?: boolean;

  @Expose({ name: 'mi' })
  isMirrored?: boolean;
}

export class State {
  @Expose({ name: 'on' })
  isOn!: boolean;

  @Expose({ name: 'bri' })
  brightness!: number;

  @Expose({ name: 'transition' })
  transition?: number;

  @Expose({ name: 'ps' })
  selectedPresetId?: number;

  @Expose({ name: 'pl' })
  selectedPlaylistId?: number;

  @Expose({ name: 'nl' })
  @Type(() => Nightlight)
  nightlight?: Nightlight;

  @Expose({ name: 'lor' })
  liveDataOverride?: number;

  @Expose({ name: 'mainseg' })
  mainSegment?: number;

  @Expose({ name: 'seg' })
  @Type(() => Segment)
  segment?: Segment[];
}

export class Wifi {
  @Expose({ name: 'bssid' })
  bssid?: string;

  @Expose({ name: 'rssi' })
  rssi?: number;

  @Expose({ name: 'signal' })
  signal?: number;

  @Expose({ name: 'channel' })
  channel?: number;

  @Expose({ name: 'ap' })
  isApMode?: boolean;
}
