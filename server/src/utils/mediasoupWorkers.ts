import Config from './config';
import mediasoup from 'mediasoup';

export const mediasoupWorkers: any = [];

export const runMediasoupWorkers= async ()=>{
  const { numWorkers } = Config.mediasoup;
  console.log('running %d mediasoup Workers...', numWorkers);
  for (let i = 0; i < numWorkers; ++i){
		const worker = await mediasoup.createWorker(
			{
				logLevel   : Config.mediasoup.workerSettings.logLevel,
				logTags    : Config.mediasoup.workerSettings.logTags,
				rtcMinPort : Number(Config.mediasoup.workerSettings.rtcMinPort),
				rtcMaxPort : Number(Config.mediasoup.workerSettings.rtcMaxPort)
			});

		worker.on('died', () =>
		{
			console.error('mediasoup Worker died, exiting  in 2 seconds... [pid:%d]', worker.pid);
			setTimeout(() => process.exit(1), 2000);
		});

		mediasoupWorkers.push(worker);
		// Log worker resource usage every X seconds.
		setInterval(async () =>{
			const usage = await worker.getResourceUsage();
			console.log('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
		}, 120000);
	}
}