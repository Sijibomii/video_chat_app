/**
 * Create a protoo WebSocketServer to allow WebSocket connections from browsers.
 */
import  protoo from 'protoo-server';
import {httpsServer} from './http'
import  url from 'url';
import  { AwaitQueue } from 'awaitqueue';
import { rooms } from './express';
import { mediasoupWorkers} from './mediasoupWorkers'
import Room from './Room'
let nextMediasoupWorkerIdx = 0;
const queue = new AwaitQueue();
let protooWebSocketServer;
const runProtooWebSocketServer= async()=>{
   console.log('running protoo WebSocketServer...');
 
   // Create the protoo WebSocket server.
   protooWebSocketServer = new protoo.WebSocketServer(httpsServer,
     {
       maxReceivedFrameSize     : 960000, // 960 KBytes.
       maxReceivedMessageSize   : 960000,
       fragmentOutgoingMessages : true,
       fragmentationThreshold   : 960000
     });
 
   // Handle connections from clients.
   protooWebSocketServer.on('connectionrequest', (info:any, accept:any, reject:any) =>{
     // The client indicates the roomId and peerId in the URL query.
     const u = url.parse(info.request.url, true);
     const roomId = u.query['roomId'];
     const peerId = u.query['peerId'];
 
     if (!roomId || !peerId)
     {
       reject(400, 'Connection request without roomId and/or peerId');
 
       return;
     }
 
     console.log(
       'protoo connection request [roomId:%s, peerId:%s, address:%s, origin:%s]',
       roomId, peerId, info.socket.remoteAddress, info.origin);
 
     // Serialize this code into the queue to avoid that two peers connecting at
     // the same time with the same roomId create two separate rooms with same
     // roomId.
     queue.push(async () =>
     {
       const room = await getOrCreateRoom({ roomId });
 
       // Accept the protoo WebSocket connection.
       const protooWebSocketTransport = accept();
 
       room.handleProtooConnection({ peerId, protooWebSocketTransport });
     })
       .catch((error: Error) =>
       {
         console.error('room creation or room joining failed:%o', error);
 
         reject(error);
       });
   });
 }
 function getMediasoupWorker()
 {
   const worker = mediasoupWorkers[nextMediasoupWorkerIdx];
 
   if (++nextMediasoupWorkerIdx === mediasoupWorkers.length)
     nextMediasoupWorkerIdx = 0;
 
   return worker;
 }
 interface getOrCreateRoom{
   roomId: String | string[]
 }
async function getOrCreateRoom(getOrCreateRoom: getOrCreateRoom){
  const { roomId }= getOrCreateRoom
	let room = rooms.get(roomId);

	// If the Room does not exist create a new one.
	if (!room)
	{
		console.log('creating a new Room [roomId:%s]', roomId);

		const mediasoupWorker = getMediasoupWorker();

		room = await Room.create({ mediasoupWorker, roomId });

		rooms.set(roomId, room);
		room.on('close', () => rooms.delete(roomId));
	}

	return room;
}
 export { runProtooWebSocketServer, protooWebSocketServer};