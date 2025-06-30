import http from 'http';
import url from 'url';
import os from 'os';
import TemperatureMonitor from './TemperatureMonitor';

class TemperatureServer {
  private server: http.Server;
  private checker: TemperatureMonitor;
  private readonly port: number;

  constructor(port = 8888, checker: TemperatureMonitor) {
    this.checker = checker;
    this.port = port;
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const parsedUrl = url.parse(req.url || '', true);
    const path = parsedUrl.pathname || '';
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] ${req.method} ${path}`);

    res.setHeader('Server', 'Proxmox-TempChecker-TS/1.0');
    res.setHeader('X-Powered-By', 'TypeScript On-Demand');

    try {
      switch (path) {
        case '/health':
          await this.handleHealthCheck(res);
          break;
        case '/temperature':
          await this.handleTemperatureCheck(res);
          break;
        case '/api':
          this.handleApiInfo(res);
          break;
        default:
          this.handle404(res, path);
      }
    } catch (error) {
      this.handleError(res, error as Error);
    }
  }

  private async handleHealthCheck(res: http.ServerResponse): Promise<void> {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Temperature Checker OK - Ready for requests');
  }

  private async handleTemperatureCheck(res: http.ServerResponse): Promise<void> {
    const result = await this.checker.checkTemperature();
    const statusCode = this.checker.getStatusCode(result.status);

    const response = {
      temperature: result.temperature,
      status: result.status,
      unit: '°C',
      thresholds: this.checker.temperatureThresholds,
      timestamp: result.timestamp,
      hostname: os.hostname()
    };

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
  }

  private handleApiInfo(res: http.ServerResponse) {
    const response = {
      service: 'Proxmox Temperature Checker',
      version: '1.0.0',
      implementation: 'TypeScript On-Demand',
      description: 'Checks temperature on each request - no background monitoring',
      thresholds: this.checker.temperatureThresholds,
      endpoints: [
        {
          path: '/health',
          description: 'Health check - always returns 200',
          method: 'GET'
        },
        {
          path: '/temperature',
          description: 'Check temperature (JSON response)',
          method: 'GET',
          responses: {
            200: 'OK - Normal temperature',
            418: 'WARNING - High temperature',
            503: 'CRITICAL - Critical temperature',
            500: 'ERROR - Sensor reading failed'
          }
        },
      ],
      usage: {
        uptime_kuma: 'Monitor /temperature/simple endpoint every 60 seconds',
        expected_status_codes: {
          200: 'Temperature OK',
          418: 'Temperature Warning (will show as warning in Uptime Kuma)',
          503: 'Temperature Critical (will show as down in Uptime Kuma)',
          500: 'Sensor Error (will show as down in Uptime Kuma)'
        }
      },
      system: {
        hostname: os.hostname(),
        nodeVersion: process.version,
        platform: os.platform()
      }
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
  }

  private handle404(res: http.ServerResponse, path: string) {
    const response = {
      error: 'Not Found',
      path: path,
      available_endpoints: ['/health', '/temperature', '/api'],
      message: 'Use /api for documentation'
    };

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
  }

  private handleError(res: http.ServerResponse, error: Error) {
    console.error('Request error:', error);

    const response = {
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    };

    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
  }

  public start(): void {
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`🌡️  Temperature checker started on port ${this.port}`);
      console.log('🔷 Mode: On-demand checking (no background monitoring)');
      console.log('🔗 Endpoints:');
      console.log(`   http://localhost:${this.port}/health`);
      console.log(`   http://localhost:${this.port}/temperature/simple`);
      console.log(`   http://localhost:${this.port}/temperature`);
      console.log(`   http://localhost:${this.port}/api`);
      console.log('📊 Ready for Uptime Kuma monitoring every 60 seconds');
      console.log(`💾 Memory usage: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
    });
  }
}

export default TemperatureServer;
