let protooPort = 4443;

if (window.location.hostname === 'test.mediasoup.org')
	protooPort = 4444;
interface url{
  roomId: any
  peerId:any
}
export function getProtooUrl(url:url){
  const { roomId, peerId }=url;
	const hostname = window.location.hostname;

	return `wss://${hostname}:${protooPort}/?roomId=${roomId}&peerId=${peerId}`;
}
 