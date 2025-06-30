export interface ITemperatureMonitor {
  getStatusCode(status: TempStatus): number;
  checkTemperature(): Promise<ITempResult>;
  temperatureThresholds(): ITemperatureThresholds;
}

export type TempStatus = 'STARTING' | 'OK' | 'WARNING' | 'CRITICAL' | 'ERROR';

export interface ITemperatureThresholds {
  warning: number;
  critical: number;
}

export interface ISensorData {
  [sensorName: string]: {
    [measurement: string]: {
      [field: string]: number | string;
    };
  };
}

export interface ITempResult {
  temperature: number;
  status: TempStatus;
  timestamp: Date;
}
