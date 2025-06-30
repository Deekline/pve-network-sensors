import TemperatureServer from './TemperatureServer';
import TemperatureMonitor from './TemperatureMonitor';


const PORT = parseInt(process.env.PORT || '8888');
const server = new TemperatureServer(PORT, new TemperatureMonitor);
server.start();
