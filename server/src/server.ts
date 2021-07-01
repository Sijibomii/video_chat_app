import {runMediasoupWorkers } from './utils/mediasoupWorkers';
import { createExpressApp,rooms} from './utils/express';
import { runHttpsServer} from './utils/http'
import {runProtooWebSocketServer} from './utils/protooServer'
//logger
//import  Logger from './utils/logger';
//const logger = new Logger();
run();

async function run(){
  // Run a mediasoup Worker.
	await runMediasoupWorkers();

	// Create Express app.
	await createExpressApp();

	// Run HTTPS server.
	await runHttpsServer();

	// Run a protoo WebSocketServer.
	await runProtooWebSocketServer();

	// Log rooms status every X seconds.
	setInterval(() =>
	{
		for (const room of rooms.values())
		{
			room.logStatus();
		}
	}, 120000);
}




