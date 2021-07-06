export const setRoomUrl = (url: string) =>
{
	return {
		type    : 'SET_ROOM_URL',
		payload : { url }
	};
};

export const setRoomState = (state: any) =>
{
	return {
		type    : 'SET_ROOM_STATE',
		payload : { state }
	};
};

export const setRoomActiveSpeaker = (peerId: any) =>
{
	return {
		type    : 'SET_ROOM_ACTIVE_SPEAKER',
		payload : { peerId }
	};
};

export const setRoomStatsPeerId = (peerId: any) =>
{
	return {
		type    : 'SET_ROOM_STATS_PEER_ID',
		payload : { peerId }
	};
};

export const setRoomFaceDetection = (flag: any) =>
{
	return {
		type    : 'SET_FACE_DETECTION',
		payload : flag
	};
};
interface setMe{
  peerId: String
  displayName: String
  displayNameSet: boolean
  device: { flag: string; name: string; version: string; }
}

export const setMe = (setMe:setMe) =>{
  const { peerId, displayName, displayNameSet, device } =setMe
	return {
		type    : 'SET_ME',
		payload : { peerId, displayName, displayNameSet, device }
	};
};

interface setMedia{
  canSendMic: any
  canSendWebcam:any
}
export const setMediaCapabilities = (setMedia:setMedia) =>{
  const { canSendMic, canSendWebcam }= setMedia;
	return {
		type    : 'SET_MEDIA_CAPABILITIES',
		payload : { canSendMic, canSendWebcam }
	};
};

export const setCanChangeWebcam = (flag: any) =>
{
	return {
		type    : 'SET_CAN_CHANGE_WEBCAM',
		payload : flag
	};
};

export const setDisplayName = (displayName: any) =>
{
	return {
		type    : 'SET_DISPLAY_NAME',
		payload : { displayName }
	};
};

export const setAudioOnlyState = (enabled: any) =>
{
	return {
		type    : 'SET_AUDIO_ONLY_STATE',
		payload : { enabled }
	};
};

export const setAudioOnlyInProgress = (flag: any) =>
{
	return {
		type    : 'SET_AUDIO_ONLY_IN_PROGRESS',
		payload : { flag }
	};
};

export const setAudioMutedState = (enabled: any) =>
{
	return {
		type    : 'SET_AUDIO_MUTED_STATE',
		payload : { enabled }
	};
};

export const setRestartIceInProgress = (flag: any) =>
{
	return {
		type    : 'SET_RESTART_ICE_IN_PROGRESS',
		payload : { flag }
	};
};

export const addProducer = (producer: any) =>
{
	return {
		type    : 'ADD_PRODUCER',
		payload : { producer }
	};
};

export const removeProducer = (producerId: any) =>
{
	return {
		type    : 'REMOVE_PRODUCER',
		payload : { producerId }
	};
};

export const setProducerPaused = (producerId: any) =>
{
	return {
		type    : 'SET_PRODUCER_PAUSED',
		payload : { producerId }
	};
};

export const setProducerResumed = (producerId: any) =>
{
	return {
		type    : 'SET_PRODUCER_RESUMED',
		payload : { producerId }
	};
};

export const setProducerTrack = (producerId: any, track: any) =>
{
	return {
		type    : 'SET_PRODUCER_TRACK',
		payload : { producerId, track }
	};
};

export const setProducerScore = (producerId: any, score: any) =>
{
	return {
		type    : 'SET_PRODUCER_SCORE',
		payload : { producerId, score }
	};
};

export const addDataProducer = (dataProducer: any) =>
{
	return {
		type    : 'ADD_DATA_PRODUCER',
		payload : { dataProducer }
	};
};

export const removeDataProducer = (dataProducerId: any) =>
{
	return {
		type    : 'REMOVE_DATA_PRODUCER',
		payload : { dataProducerId }
	};
};

export const setWebcamInProgress = (flag: any) =>
{
	return {
		type    : 'SET_WEBCAM_IN_PROGRESS',
		payload : { flag }
	};
};

export const setShareInProgress = (flag: any) =>
{
	return {
		type    : 'SET_SHARE_IN_PROGRESS',
		payload : { flag }
	};
};

export const addPeer = (peer: any) =>
{
	return {
		type    : 'ADD_PEER',
		payload : { peer }
	};
};

export const removePeer = (peerId: any) =>
{
	return {
		type    : 'REMOVE_PEER',
		payload : { peerId }
	};
};

export const setPeerDisplayName = (displayName: any, peerId: any) =>
{
	return {
		type    : 'SET_PEER_DISPLAY_NAME',
		payload : { displayName, peerId }
	};
};

export const addConsumer = (consumer: any, peerId: any) =>
{
	return {
		type    : 'ADD_CONSUMER',
		payload : { consumer, peerId }
	};
};

export const removeConsumer = (consumerId: any, peerId: any) =>
{
	return {
		type    : 'REMOVE_CONSUMER',
		payload : { consumerId, peerId }
	};
};

export const setConsumerPaused = (consumerId: any, originator: any) =>
{
	return {
		type    : 'SET_CONSUMER_PAUSED',
		payload : { consumerId, originator }
	};
};

export const setConsumerResumed = (consumerId: any, originator: any) =>
{
	return {
		type    : 'SET_CONSUMER_RESUMED',
		payload : { consumerId, originator }
	};
};

export const setConsumerCurrentLayers = (consumerId: any, spatialLayer: any, temporalLayer: any) =>
{
	return {
		type    : 'SET_CONSUMER_CURRENT_LAYERS',
		payload : { consumerId, spatialLayer, temporalLayer }
	};
};

export const setConsumerPreferredLayers = (consumerId: any, spatialLayer: any, temporalLayer: any) =>
{
	return {
		type    : 'SET_CONSUMER_PREFERRED_LAYERS',
		payload : { consumerId, spatialLayer, temporalLayer }
	};
};

export const setConsumerPriority = (consumerId: any, priority: any) =>
{
	return {
		type    : 'SET_CONSUMER_PRIORITY',
		payload : { consumerId, priority }
	};
};

export const setConsumerTrack = (consumerId: any, track: any) =>
{
	return {
		type    : 'SET_CONSUMER_TRACK',
		payload : { consumerId, track }
	};
};

export const setConsumerScore = (consumerId: any, score: any) =>
{
	return {
		type    : 'SET_CONSUMER_SCORE',
		payload : { consumerId, score }
	};
};

export const addDataConsumer = (dataConsumer: any, peerId: any) =>
{
	return {
		type    : 'ADD_DATA_CONSUMER',
		payload : { dataConsumer, peerId }
	};
};

export const removeDataConsumer = (dataConsumerId: any, peerId: any) =>
{
	return {
		type    : 'REMOVE_DATA_CONSUMER',
		payload : { dataConsumerId, peerId }
	};
};

export const addNotification = (notification: any) =>
{
	return {
		type    : 'ADD_NOTIFICATION',
		payload : { notification }
	};
};

export const removeNotification = (notificationId: any) =>
{
	return {
		type    : 'REMOVE_NOTIFICATION',
		payload : { notificationId }
	};
};

export const removeAllNotifications = () =>
{
	return {
		type : 'REMOVE_ALL_NOTIFICATIONS'
	};
};
