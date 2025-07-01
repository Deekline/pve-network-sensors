# Temperature Monitor

Simple TypeScript temperature monitoring service for Proxmox with Uptime Kuma integration.

## Features

- 🌡️ **On-demand temperature checking** - No background monitoring
- 🔗 **HTTP API endpoints** - JSON and text responses
- 📊 **Status codes** - 200 (OK), 418 (Warning), 503 (Critical), 500 (Error)
- 🔧 **Configurable thresholds** - Environment variable configuration

## Prerequisites

- Node.js 16+
- `lm-sensors` package installed

## Installation

```bash
# Install lm-sensors
apt update && apt install lm-sensors
sensors-detect

# Clone/download project
mkdir /opt/temp-monitor
cd /opt/temp-monitor

# Install dependencies
npm install

# Compile TypeScript
npm run build
```


### SystemD Service
```bash
# Create service file
sudo nano /etc/systemd/system/temp-monitor.service
```

```ini
[Unit]
Description=Temperature Monitor Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/temp-monitor
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=PORT=8888
Environment=TEMP_WARNING=70
Environment=TEMP_CRITICAL=80

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable temp-monitor
sudo systemctl start temp-monitor
```

## API Endpoints

| Endpoint | Description | Response |
|----------|-------------|----------|
| `/health` | Health check | `200` - Always OK |
| `/temperature` | Detailed JSON | `200/418/503/500` |
| `/api` | Documentation | `200` - Service info |

### Response Codes

- **200 OK** - Temperature < warning threshold
- **418 Warning** - Temperature ≥ warning, < critical
- **503 Critical** - Temperature ≥ critical threshold
- **500 Error** - Sensor reading failed

### Example Responses

## Uptime Kuma Integration

**Monitor Configuration:**
- **URL**: `http://10.0.10.2:8888/temperature/simple`
- **Interval**: 60 seconds
- **Expected Status Codes**: `200,418,503`

**Status Interpretation:**
- 🟢 **UP** - Temperature normal (200)
- 🟡 **WARNING** - Temperature high (418) 
- 🔴 **DOWN** - Temperature critical (503) or sensor error (500)

### Check Sensors
```bash
sensors                    # Test sensor access
sensors -j                 # JSON output
```

### Test Endpoints
```bash
curl http://localhost:8888/health           # Health check
curl http://localhost:8888/temperature      # Full JSON
curl http://localhost:8888/api              # Documentation
```

### Common Issues

## License

MIT License - Feel free to modify and distribute.
