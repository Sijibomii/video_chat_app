import { render } from 'react-dom';
import { Provider } from 'react-redux';
import UrlParse from 'url-parse';
import randomString from 'random-string';
import domready from 'domready';
import thunk from 'redux-thunk';
import {
  AnyAction,
	applyMiddleware as applyReduxMiddleware,
	createStore as createReduxStore,
  EmptyObject,
  Store
} from 'redux';
import * as cookiesManager from './cookiesManager';//check what js-cookie does
import reducers from './redux/reducers';
import * as faceapi from 'face-api.js';//check more on face-api too
import randomName from './randomName';//check what pokemon does, check the github issue too
import deviceInfo from './deviceInfo';//check what browser does, read through this...
import * as stateActions from './redux/stateActions';//actions for redux read through..
import RoomContext from './RoomContext';// check what react.context does
import RoomClient from './RoomClient';
import { Room } from './components/Room';
//read up on the e2e.ts 
type t={
  timeout: number
  bot: boolean
}
declare global {
  interface Window {
      STORE:Store<EmptyObject, AnyAction> & {
        dispatch: unknown;
    }
    SHOW_INFO: boolean
    NETWORK_THROTTLE_SECRET: String
    BOWSER:any
    CLIENT: any
    CC:any
    __sendSdps: () => void
  __recvSdps: () => void
  __startDataChannelTest: () => void
  __stopDataChannelTest:() => void
  __testSctp: (t:t)=> void
  H1:any
  PC1:any
  DP:any
  H2:any
  PC2:any
  }
}
//init redux
let roomClient:any;
const reduxMiddleware=[thunk];
const store = createReduxStore(
	reducers,
	undefined,
	applyReduxMiddleware(...reduxMiddleware)
);
window.STORE = store;
//init room client here

domready(async () =>{
	console.log('DOM ready');
	//await utils.initialize();
	run();
});
async function run(){
  console.log('run() [environment:%s]', process.env.NODE_ENV)
  const urlParser = new UrlParse(window.location.href, true);//check what urlparser does
  console.log(urlParser)
  const peerId = randomString({ length: 10 }).toLowerCase();
	let roomId = urlParser.query.roomId;
  let displayName = urlParser.query.displayName || (cookiesManager.getUser() || {}).displayName;
  const handler = urlParser.query.handler;
	const useSimulcast = urlParser.query.simulcast !== 'false';
	const useSharingSimulcast = urlParser.query.sharingSimulcast !== 'false';
	const forceTcp = urlParser.query.forceTcp === 'true';
	const produce = urlParser.query.produce !== 'false';
	const consume = urlParser.query.consume !== 'false';
	const forceH264 = urlParser.query.forceH264 === 'true';
	const forceVP9 = urlParser.query.forceVP9 === 'true';
	const svc = urlParser.query.svc;
	const datachannel = urlParser.query.datachannel !== 'false';
	const info = urlParser.query.info === 'true';
	const faceDetection = urlParser.query.faceDetection === 'true';
	const externalVideo = urlParser.query.externalVideo === 'true';
	const throttleSecret = urlParser.query.throttleSecret;
	const e2eKey = urlParser.query.e2eKey;

  // Enable face detection on demand.
	if (faceDetection) await faceapi.loadTinyFaceDetectorModel('/resources/face-detector-models');

  if (info){
		window.SHOW_INFO = true;
	}

	if (throttleSecret){
		window.NETWORK_THROTTLE_SECRET = throttleSecret;
	}

	if (!roomId){
		roomId = randomString({ length: 8 }).toLowerCase();

		urlParser.query.roomId = roomId;
		window.history.pushState('', '', urlParser.toString());
	}

	// Get the effective/shareable Room URL.
	const roomUrlParser = new UrlParse(window.location.href, true);//what is this?
  for (const key of Object.keys(roomUrlParser.query)){
		// Don't keep some custom params.
		switch (key){
			case 'roomId':
			case 'handler':
			case 'simulcast':
			case 'sharingSimulcast':
			case 'produce':
			case 'consume':
			case 'forceH264':
			case 'forceVP9':
			case 'forceTcp':
			case 'svc':
			case 'datachannel':
			case 'info':
			case 'faceDetection':
			case 'externalVideo':
			case 'throttleSecret':
			case 'e2eKey':
				break;

			default:
				delete roomUrlParser.query[key];
		}
	}
  delete roomUrlParser.hash;

	const roomUrl = roomUrlParser.toString();

	let displayNameSet;

	// If displayName was provided via URL or Cookie, we are done.
	if (displayName){
		displayNameSet = true;
	}
	// Otherwise pick a random name and mark as "not set".
	else{
		displayNameSet = false;
		displayName = randomName();
	}

	// Get current device info.
	const device = deviceInfo();

	store.dispatch(stateActions.setRoomUrl(roomUrl));
	store.dispatch(stateActions.setRoomFaceDetection(faceDetection));
	store.dispatch(stateActions.setMe({ peerId, displayName, displayNameSet, device }));

  roomClient = new RoomClient({
			roomId,
			peerId,
			displayName,
			device,
			handlerName : handler,
			useSimulcast,
			useSharingSimulcast,
			forceTcp,
			produce,
			consume,
			forceH264,
			forceVP9,
			svc,
			datachannel,
			externalVideo,
			e2eKey
		});

	// // NOTE: For debugging.
	// // eslint-disable-next-line require-atomic-updates
	// window.CLIENT = roomClient;
	// // eslint-disable-next-line require-atomic-updates
	// window.CC = roomClient;

	 render(
	 	<Provider store={store}>
	 		<RoomContext.Provider value={roomClient}>
	 			<Room roomClient={roomClient}/>
	 		</RoomContext.Provider>
	 	</Provider>,
	 	 document.getElementById('root')
	 );
}

// NOTE: Debugging stuff.

window.__sendSdps = function(){
  //sends SDP offer and answer to peers for connection
	console.log('>>> send transport local SDP offer:');
	console.log(
		roomClient._sendTransport._handler._pc.localDescription.sdp);

	console.log('>>> send transport remote SDP answer:');
	console.log(
		roomClient._sendTransport._handler._pc.remoteDescription.sdp);
};

window.__recvSdps = function()
{
  //receive SDP offer and answer from peers for connection
	console.log('>>> recv transport remote SDP offer:');
	console.log(
		roomClient._recvTransport._handler._pc.remoteDescription.sdp);

	console.log('>>> recv transport local SDP answer:');
	console.log(
		roomClient._recvTransport._handler._pc.localDescription.sdp);
};

let dataChannelTestInterval:any = null;

window.__startDataChannelTest = function()
{
	let number = 0;

	const buffer = new ArrayBuffer(32);
	const view = new DataView(buffer);

	dataChannelTestInterval = window.setInterval(() =>
	{
		if (window.DP)
		{
			view.setUint32(0, number++);
			roomClient.sendChatMessage(buffer);
		}
	}, 100);
};

window.__stopDataChannelTest = function()
{
	window.clearInterval(dataChannelTestInterval);

	const buffer = new ArrayBuffer(32);
	const view = new DataView(buffer);

	if (window.DP)
	{
		view.setUint32(0, Math.pow(2, 32) - 1);
		window.DP.send(buffer);
	}
};

window.__testSctp = async function({ timeout = 100, bot = false }){
	let dp:any;

	if (!bot)
	{
		await window.CLIENT.enableChatDataProducer();

		dp = window.CLIENT._chatDataProducer;
	}
	else
	{
		await window.CLIENT.enableBotDataProducer();

		dp = window.CLIENT._botDataProducer;
	}

	console.log(
		'<<< testSctp: DataProducer created [bot:%s, streamId:%d, readyState:%s]',
		bot ? 'true' : 'false',
		dp.sctpStreamParameters.streamId,
		dp.readyState);

	function send()
	{
		dp.send(`I am streamId ${dp.sctpStreamParameters.streamId}`);
	}

	if (dp.readyState === 'open')
	{
		send();
	}
	else
	{
		dp.on('open', () =>
		{
			console.log(
				'<<< testSctp: DataChannel open [streamId:%d]',
				dp.sctpStreamParameters.streamId);

			send();
		});
	}

	setTimeout(() => window.__testSctp({ timeout, bot }), timeout);
};

setInterval(() =>
{
	if (window.CLIENT._sendTransport)
	{
		window.H1 = window.CLIENT._sendTransport._handler;
		window.PC1 = window.CLIENT._sendTransport._handler._pc;
		window.DP = window.CLIENT._chatDataProducer;
	}
  
	else
	{
		delete window.PC1;
		delete window.DP;
	}

	if (window.CLIENT._recvTransport)
	{
		window.H2 = window.CLIENT._recvTransport._handler;
		window.PC2 = window.CLIENT._recvTransport._handler._pc;
	}
	else
	{
		delete window.PC2;
	}
}, 2000);
