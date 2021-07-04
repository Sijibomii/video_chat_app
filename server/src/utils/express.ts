import  express from 'express';
import  { urlencoded }from 'body-parser';
let expressApp:any;
// Map of Room instances indexed by roomId.
// @type {Map<Number, Room>}
//  Map { bla: 'blaa', bla2: 'blaaa2' } key value pairs
const rooms = new Map();
export const createExpressApp=async()=>{
	console.log('creating Express app...');

	expressApp = express();

 expressApp.use(urlencoded());//???

	/**
	 * For every API request, verify that the roomId in the path matches and
	 * existing room.
	 */
  //works like middleware for this route
	expressApp.param('roomId', (req:any, _:any, next:any, roomId:String) =>{
			// The room must exist for all API requests.
			if (!rooms.has(roomId)){
				const error = new Error(`room with id "${roomId}" not found`);

				//error.status = 404;
				throw error;
			}

			req.room = rooms.get(roomId);//checks the rooms map to get the room with this Id

			next();
		});

	/**
	 * API GET resource that returns the mediasoup Router RTP capabilities of
	 * the room.
	 */
	expressApp.get('/rooms/:roomId', (req:any, res:any) =>{
		console.log('rooms')
			const data = req.room.getRouterRtpCapabilities();

			res.status(200).json(data);
		});

	/**
	 * POST API to create a Broadcaster.
	 */
	expressApp.post('/rooms/:roomId/broadcasters', async (req:any, res:any, next:any) =>{
			const {
				id,
				displayName,
				device,
				rtpCapabilities
			} = req.body;

			try
			{
				const data = await req.room.createBroadcaster(
					{
						id,
						displayName,
						device,
						rtpCapabilities
					});

				res.status(200).json(data);
			}
			catch (error)
			{
				next(error);
			}
		});

	/**
	 * DELETE API to delete a Broadcaster.
	 */
	expressApp.delete(
		'/rooms/:roomId/broadcasters/:broadcasterId', (req:any, res:any) =>
		{
			const { broadcasterId } = req.params;

			req.room.deleteBroadcaster({ broadcasterId });

			res.status(200).send('broadcaster deleted');
		});

	/**
	 * POST API to create a mediasoup Transport associated to a Broadcaster.
	 * It can be a PlainTransport or a WebRtcTransport depending on the
	 * type parameters in the body. There are also additional parameters for
	 * PlainTransport.
	 */
	expressApp.post(
		'/rooms/:roomId/broadcasters/:broadcasterId/transports',
		async (req:any, res:any, next:any) =>
		{
			const { broadcasterId } = req.params;
			const { type, rtcpMux, comedia, sctpCapabilities } = req.body;

			try
			{
				const data = await req.room.createBroadcasterTransport(
					{
						broadcasterId,
						type,
						rtcpMux,
						comedia, 
						sctpCapabilities
					});

				res.status(200).json(data);
			}
			catch (error)
			{
				next(error);
			}
		});

	/**
	 * POST API to connect a Transport belonging to a Broadcaster. Not needed
	 * for PlainTransport if it was created with comedia option set to true.
	 */
	expressApp.post(
		'/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/connect',
		async (req:any, res:any, next:any) =>
		{
			const { broadcasterId, transportId } = req.params;
			const { dtlsParameters } = req.body;

			try
			{
				const data = await req.room.connectBroadcasterTransport(
					{
						broadcasterId,
						transportId,
						dtlsParameters
					});

				res.status(200).json(data);
			}
			catch (error)
			{
				next(error);
			}
		});

	/**
	 * POST API to create a mediasoup Producer associated to a Broadcaster.
	 * The exact Transport in which the Producer must be created is signaled in
	 * the URL path. Body parameters include kind and rtpParameters of the
	 * Producer.
	 */
	expressApp.post(
		'/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/producers',
		async (req:any, res:any, next:any) =>
		{
			const { broadcasterId, transportId } = req.params;
			const { kind, rtpParameters } = req.body;

			try
			{
				const data = await req.room.createBroadcasterProducer(
					{
						broadcasterId,
						transportId,
						kind,
						rtpParameters
					});

				res.status(200).json(data);
			}
			catch (error)
			{
				next(error);
			}
		});

	/**
	 * POST API to create a mediasoup Consumer associated to a Broadcaster.
	 * The exact Transport in which the Consumer must be created is signaled in
	 * the URL path. Query parameters must include the desired producerId to
	 * consume.
	 */
	expressApp.post(
		'/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume',
		async (req:any, res:any, next:any) =>
		{
			const { broadcasterId, transportId } = req.params;
			const { producerId } = req.query;

			try
			{
				const data = await req.room.createBroadcasterConsumer(
					{
						broadcasterId,
						transportId,
						producerId
					});

				res.status(200).json(data);
			}
			catch (error)
			{
				next(error);
			}
		});

	/**
	 * POST API to create a mediasoup DataConsumer associated to a Broadcaster.
	 * The exact Transport in which the DataConsumer must be created is signaled in
	 * the URL path. Query body must include the desired producerId to
	 * consume.
	 */
	expressApp.post(
		'/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume/data',
		async (req:any, res:any, next:any) =>
		{
			const { broadcasterId, transportId } = req.params;
			const { dataProducerId } = req.body;

			try
			{
				const data = await req.room.createBroadcasterDataConsumer(
					{
						broadcasterId,
						transportId,
						dataProducerId
					});

				res.status(200).json(data);
			}
			catch (error)
			{
				next(error);
			}
		});
	
	/**
	 * POST API to create a mediasoup DataProducer associated to a Broadcaster.
	 * The exact Transport in which the DataProducer must be created is signaled in
	 */
	expressApp.post(
		'/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/produce/data',
		async (req:any, res:any, next:any) =>
		{
			const { broadcasterId, transportId } = req.params;
			const { label, protocol, sctpStreamParameters, appData } = req.body;

			try
			{
				const data = await req.room.createBroadcasterDataProducer(
					{
						broadcasterId,
						transportId,
						label,
						protocol,
						sctpStreamParameters,
						appData
					});

				res.status(200).json(data);
			}
			catch (error)
			{
				next(error);
			}
		});

	/**
	 * Error handler.
	 */
	expressApp.use(
		(error: Error, _:any, res:any, next:any) =>
		{
			if (error)
			{
				console.log('Express app %s', String(error));

				//error.status = error.status || (error.name === 'TypeError' ? 400 : 500);

				res.statusMessage = error.message;
				res.status( (error.name === 'TypeError' ? 400 : 500)).send(String(error));
			}
			else
			{
				next();
			}
		});
		const port =4443
		expressApp.listen(port, () => {
			console.log(`listening at localhost port 4443 sirrr${port}`)
		})
}
export {expressApp, rooms};