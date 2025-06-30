import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { ITemperatureMonitor, ITemperatureThresholds, ISensorData, ITempResult, TempStatus } from './interfaces/TemperatureMonitor';

const execAsync = promisify(exec);


class TemperatureMonitor implements ITemperatureMonitor {
  private readonly thresholds: ITemperatureThresholds;

  constructor() {
    this.thresholds = {
      warning: parseInt(process.env?.TEMP_WARNING || '70'),
      critical: parseInt(process.env?.TEMP_CRITICAL || '80')
    };
  }

  private async readSensors(): Promise<ISensorData> {
    try {
      const { stdout } = await execAsync('sensors -j', { timeout: 5000 });
      return JSON.parse(stdout);
    } catch (e) {
      throw Error(`Failed to read sensors: ${(e as Error).message} `);
    }
  }

  private parseCpuTemperature(sensorData: ISensorData): number {
    for (const [sensorName, sensorInfo] of Object.entries(sensorData)) {
      if (sensorName.includes('coretemp')) {
        const packageData = sensorInfo['Package id 0'];
        if (packageData?.temp1_input) {
          return Math.round((packageData.temp1_input as number) * 10) / 10;
        }
      }
    }
    return 0;
  }

  private parseNicTemperature(sensorData: ISensorData): number {
    for (const [sensorName, sensorInfo] of Object.entries(sensorData)) {
      if (sensorName.includes('pci')) {
        const packageData = sensorInfo['loc1'];
        if (packageData?.temp1_input) {
          return Math.round((packageData.temp1_input as number) * 10) / 10;
        }
      }
    }
    return 0;
  }

  private determineStatus(temp: number): TempStatus {
    if (temp === 0) return 'ERROR';
    if (temp >= this.thresholds.critical) return 'CRITICAL';
    if (temp >= this.thresholds.warning) return 'WARNING';
    return 'OK';
  }

  public async checkTemperature(): Promise<ITempResult> {
    try {
      const sensorData = await this.readSensors();
      const cpuTemperature = this.parseCpuTemperature(sensorData);
      const nicTemperature = this.parseNicTemperature(sensorData);
      const temperature = cpuTemperature >= nicTemperature ? cpuTemperature : nicTemperature;
      const status = this.determineStatus(temperature);

      return {
        temperature,
        status,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Failed to get temerature: ${(error as Error).message}`);
      return {
        temperature: 0,
        status: 'ERROR',
        timestamp: new Date()
      };
    }
  }

  public getStatusCode(status: TempStatus): number {
    switch (status) {
      case 'OK': return 200;
      case 'WARNING': return 418;
      case 'CRITICAL': return 503;
      case 'ERROR': return 500;
      default: return 404;
    }
  }

  public temperatureThresholds(): ITemperatureThresholds {
    return { ...this.thresholds };
  }
}
export default TemperatureMonitor;
