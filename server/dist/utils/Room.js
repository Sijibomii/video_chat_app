"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const protoo_server_1 = __importDefault(require("protoo-server"));
const throttle_1 = __importDefault(require("@sitespeed.io/throttle"));
const config_1 = __importDefault(require("./config"));
class Room extends events_1.EventEmitter {
    constructor(constr) {
        super();
        const { roomId, protooRoom, mediasoupRouter, audioLevelObserver } = constr;
        this.setMaxListeners(Infinity);
        this._roomId = roomId;
        this._closed = false;
        this._protooRoom = protooRoom;
        this._broadcasters = new Map();
        this._mediasoupRouter = mediasoupRouter;
        this._audioLevelObserver = audioLevelObserver;
        this._networkThrottled = false;
        this._handleAudioLevelObserver();
    }
    static create(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const { mediasoupWorker, roomId } = input;
            console.log('create() [roomId:%s]', roomId);
            const protooRoom = new protoo_server_1.default.Room();
            const { mediaCodecs } = config_1.default.mediasoup.routerOptions;
            const mediasoupRouter = yield mediasoupWorker.createRouter({ mediaCodecs });
            const audioLevelObserver = yield mediasoupRouter.createAudioLevelObserver({
                maxEntries: 1,
                threshold: -80,
                interval: 800
            });
            return new Room({
                roomId,
                protooRoom,
                mediasoupRouter,
                audioLevelObserver,
            });
        });
    }
    close() {
        console.log('close()');
        this._closed = true;
        this._protooRoom.close();
        this._mediasoupRouter.close();
        this.emit('close');
        if (this._networkThrottled) {
            throttle_1.default.stop({})
                .catch(() => { });
        }
    }
    logStatus() {
        console.log('logStatus() [roomId:%s, protoo Peers:%s, mediasoup Transports:%s]', this._roomId, this._protooRoom.peers.length, this._mediasoupRouter._transports.size);
    }
    handleProtooConnection(prooto) {
        const { peerId, consume, protooWebSocketTransport } = prooto;
        const existingPeer = this._protooRoom.getPeer(peerId);
        if (existingPeer) {
            console.log('handleProtooConnection() | there is already a protoo Peer with same peerId, closing it [peerId:%s]', peerId);
            existingPeer.close();
        }
        let peer;
        try {
            peer = this._protooRoom.createPeer(peerId, protooWebSocketTransport);
        }
        catch (error) {
            console.error('protooRoom.createPeer() failed:%o', error);
        }
        peer.data.consume = consume;
        peer.data.joined = false;
        peer.data.displayName = undefined;
        peer.data.device = undefined;
        peer.data.rtpCapabilities = undefined;
        peer.data.sctpCapabilities = undefined;
        peer.data.transports = new Map();
        peer.data.producers = new Map();
        peer.data.consumers = new Map();
        peer.data.dataProducers = new Map();
        peer.data.dataConsumers = new Map();
        peer.on('request', (request, accept, reject) => {
            console.log('protoo Peer "request" event [method:%s, peerId:%s]', request.method, peer.id);
            this._handleProtooRequest(peer, request, accept, reject)
                .catch((error) => {
                console.error('request failed:%o', error);
                reject(error);
            });
        });
        peer.on('close', () => {
            if (this._closed)
                return;
            console.log('protoo Peer "close" event [peerId:%s]', peer.id);
            if (peer.data.joined) {
                for (const otherPeer of this._getJoinedPeers({ excludePeer: peer })) {
                    otherPeer.notify('peerClosed', { peerId: peer.id })
                        .catch(() => { });
                }
            }
            for (const transport of peer.data.transports.values()) {
                transport.close();
            }
            if (this._protooRoom.peers.length === 0) {
                console.log('last Peer in the room left, closing the room [roomId:%s]', this._roomId);
                this.close();
            }
        });
    }
    getRouterRtpCapabilities() {
        return this._mediasoupRouter.rtpCapabilities;
    }
    createBroadcaster(createBroad) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, displayName, device, rtpCapabilities } = createBroad;
            if (typeof id !== 'string' || !id)
                throw new TypeError('missing body.id');
            else if (typeof displayName !== 'string' || !displayName)
                throw new TypeError('missing body.displayName');
            else if (typeof device.name !== 'string' || !device.name)
                throw new TypeError('missing body.device.name');
            else if (rtpCapabilities && typeof rtpCapabilities !== 'object')
                throw new TypeError('wrong body.rtpCapabilities');
            if (this._broadcasters.has(id))
                throw new Error(`broadcaster with id "${id}" already exists`);
            const broadcaster = {
                id,
                data: {
                    displayName,
                    device: {
                        flag: 'broadcaster',
                        name: device.name || 'Unknown device',
                        version: device.version
                    },
                    rtpCapabilities,
                    transports: new Map(),
                    producers: new Map(),
                    consumers: new Map(),
                    dataProducers: new Map(),
                    dataConsumers: new Map()
                }
            };
            this._broadcasters.set(broadcaster.id, broadcaster);
            for (const otherPeer of this._getJoinedPeers()) {
                otherPeer.notify('newPeer', {
                    id: broadcaster.id,
                    displayName: broadcaster.data.displayName,
                    device: broadcaster.data.device
                })
                    .catch(() => { });
            }
            const peerInfos = [];
            const joinedPeers = this._getJoinedPeers();
            const prodd = [];
            if (rtpCapabilities) {
                for (const joinedPeer of joinedPeers) {
                    const peerInfo = {
                        id: joinedPeer.id,
                        displayName: joinedPeer.data.displayName,
                        device: joinedPeer.data.device,
                        producers: prodd
                    };
                    for (const producer of joinedPeer.data.producers.values()) {
                        if (!this._mediasoupRouter.canConsume({
                            producerId: producer.id,
                            rtpCapabilities
                        })) {
                            continue;
                        }
                        peerInfo.producers.push({
                            id: producer.id,
                            kind: producer.kind
                        });
                    }
                    peerInfos.push(peerInfo);
                }
            }
            return { peers: peerInfos };
        });
    }
    deleteBroadcaster(delBroad) {
        const { broadcasterId } = delBroad;
        let broadcaster;
        broadcaster = this._broadcasters.get(broadcasterId);
        if (!broadcaster)
            throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);
        for (const transport of broadcaster.data.transports.values()) {
            transport.close();
        }
        this._broadcasters.delete(broadcasterId);
        for (const peer of this._getJoinedPeers()) {
            peer.notify('peerClosed', { peerId: broadcasterId })
                .catch(() => { });
        }
    }
    createBroadcasterTransport(createBroad) {
        return __awaiter(this, void 0, void 0, function* () {
            const { broadcasterId, type, rtcpMux = false, comedia = true, sctpCapabilities } = createBroad;
            let broadcaster;
            broadcaster = this._broadcasters.get(broadcasterId);
            if (!broadcaster)
                throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);
            switch (type) {
                case 'webrtc':
                    {
                        const webRtcTransportOptions = Object.assign(Object.assign({}, config_1.default.mediasoup.webRtcTransportOptions), { enableSctp: Boolean(sctpCapabilities), numSctpStreams: sctpCapabilities.numStreams || {} });
                        const transport = yield this._mediasoupRouter.createWebRtcTransport(webRtcTransportOptions);
                        broadcaster.data.transports.set(transport.id, transport);
                        return {
                            id: transport.id,
                            iceParameters: transport.iceParameters,
                            iceCandidates: transport.iceCandidates,
                            dtlsParameters: transport.dtlsParameters,
                            sctpParameters: transport.sctpParameters
                        };
                    }
                case 'plain':
                    {
                        const plainTransportOptions = Object.assign(Object.assign({}, config_1.default.mediasoup.plainTransportOptions), { rtcpMux: rtcpMux, comedia: comedia });
                        const transport = yield this._mediasoupRouter.createPlainTransport(plainTransportOptions);
                        broadcaster.data.transports.set(transport.id, transport);
                        return {
                            id: transport.id,
                            ip: transport.tuple.localIp,
                            port: transport.tuple.localPort,
                            rtcpPort: transport.rtcpTuple ? transport.rtcpTuple.localPort : undefined
                        };
                    }
                default:
                    {
                        throw new TypeError('invalid type');
                    }
            }
        });
    }
    createBroadcasterProducer(createBroadProd) {
        return __awaiter(this, void 0, void 0, function* () {
            const { broadcasterId, kind, rtpParameters, transportId } = createBroadProd;
            let broadcaster;
            broadcaster = this._broadcasters.get(broadcasterId);
            if (!broadcaster)
                throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);
            const transport = broadcaster.data.transports.get(transportId);
            if (!transport)
                throw new Error(`transport with id "${transportId}" does not exist`);
            const producer = yield transport.produce({ kind, rtpParameters });
            broadcaster.data.producers.set(producer.id, producer);
            producer.on('videoorientationchange', (videoOrientation) => {
                console.log('broadcaster producer "videoorientationchange" event [producerId:%s, videoOrientation:%o]', producer.id, videoOrientation);
            });
            for (const peer of this._getJoinedPeers()) {
                this._createConsumer({
                    consumerPeer: peer,
                    producerPeer: broadcaster,
                    producer
                });
            }
            if (producer.kind === 'audio') {
                this._audioLevelObserver.addProducer({ producerId: producer.id })
                    .catch(() => { });
            }
            return { id: producer.id };
        });
    }
    connectBroadcasterTransport(connectBroad) {
        return __awaiter(this, void 0, void 0, function* () {
            const { broadcasterId, transportId, dtlsParameters } = connectBroad;
            let broadcaster;
            broadcaster = this._broadcasters.get(broadcasterId);
            if (!broadcaster)
                throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);
            const transport = broadcaster.data.transports.get(transportId);
            if (!transport)
                throw new Error(`transport with id "${transportId}" does not exist`);
            if (transport.constructor.name !== 'WebRtcTransport') {
                throw new Error(`transport with id "${transportId}" is not a WebRtcTransport`);
            }
            yield transport.connect({ dtlsParameters });
        });
    }
    createBroadcasterConsumer(consumBroad) {
        return __awaiter(this, void 0, void 0, function* () {
            const { broadcasterId, transportId, producerId } = consumBroad;
            let broadcaster;
            broadcaster = this._broadcasters.get(broadcasterId);
            if (!broadcaster)
                throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);
            if (!broadcaster.data.rtpCapabilities)
                throw new Error('broadcaster does not have rtpCapabilities');
            const transport = broadcaster.data.transports.get(transportId);
            if (!transport)
                throw new Error(`transport with id "${transportId}" does not exist`);
            const consumer = yield transport.consume({
                producerId,
                rtpCapabilities: broadcaster.data.rtpCapabilities
            });
            broadcaster.data.consumers.set(consumer.id, consumer);
            consumer.on('transportclose', () => {
                broadcaster.data.consumers.delete(consumer.id);
            });
            consumer.on('producerclose', () => {
                broadcaster.data.consumers.delete(consumer.id);
            });
            return {
                id: consumer.id,
                producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
                type: consumer.type
            };
        });
    }
    createBroadcasterDataConsumer(dataBroad) {
        return __awaiter(this, void 0, void 0, function* () {
            const { transportId, broadcasterId, dataProducerId } = dataBroad;
            let broadcaster;
            broadcaster = this._broadcasters.get(broadcasterId);
            if (!broadcaster)
                throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);
            if (!broadcaster.data.rtpCapabilities)
                throw new Error('broadcaster does not have rtpCapabilities');
            const transport = broadcaster.data.transports.get(transportId);
            if (!transport)
                throw new Error(`transport with id "${transportId}" does not exist`);
            const dataConsumer = yield transport.consumeData({
                dataProducerId
            });
            broadcaster.data.dataConsumers.set(dataConsumer.id, dataConsumer);
            dataConsumer.on('transportclose', () => {
                broadcaster.data.dataConsumers.delete(dataConsumer.id);
            });
            dataConsumer.on('dataproducerclose', () => {
                broadcaster.data.dataConsumers.delete(dataConsumer.id);
            });
            return {
                id: dataConsumer.id
            };
        });
    }
    createBroadcasterDataProducer(dataProBroad) {
        return __awaiter(this, void 0, void 0, function* () {
            const { broadcasterId, transportId, appData, label, protocol, sctpStreamParameters } = dataProBroad;
            let broadcaster;
            broadcaster = this._broadcasters.get(broadcasterId);
            if (!broadcaster)
                throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);
            const transport = broadcaster.data.transports.get(transportId);
            if (!transport)
                throw new Error(`transport with id "${transportId}" does not exist`);
            const dataProducer = yield transport.produceData({
                sctpStreamParameters,
                label,
                protocol,
                appData
            });
            broadcaster.data.dataProducers.set(dataProducer.id, dataProducer);
            dataProducer.on('transportclose', () => {
                broadcaster.data.dataProducers.delete(dataProducer.id);
            });
            return {
                id: dataProducer.id
            };
        });
    }
    _handleAudioLevelObserver() {
        this._audioLevelObserver.on('volumes', (volumes) => {
            const { producer, volume } = volumes[0];
            for (const peer of this._getJoinedPeers()) {
                peer.notify('activeSpeaker', {
                    peerId: producer.appData.peerId,
                    volume: volume
                })
                    .catch(() => { });
            }
        });
        this._audioLevelObserver.on('silence', () => {
            for (const peer of this._getJoinedPeers()) {
                peer.notify('activeSpeaker', { peerId: null })
                    .catch(() => { });
            }
        });
    }
    _handleProtooRequest(peer, request, accept, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (request.method) {
                case 'getRouterRtpCapabilities':
                    {
                        accept(this._mediasoupRouter.rtpCapabilities);
                        break;
                    }
                case 'join':
                    {
                        if (peer.data.joined)
                            throw new Error('Peer already joined');
                        const { displayName, device, rtpCapabilities, sctpCapabilities } = request.data;
                        peer.data.joined = true;
                        peer.data.displayName = displayName;
                        peer.data.device = device;
                        peer.data.rtpCapabilities = rtpCapabilities;
                        peer.data.sctpCapabilities = sctpCapabilities;
                        const joinedPeers = [
                            ...this._getJoinedPeers(),
                            ...this._broadcasters.values()
                        ];
                        const peerInfos = joinedPeers
                            .filter((joinedPeer) => joinedPeer.id !== peer.id)
                            .map((joinedPeer) => ({
                            id: joinedPeer.id,
                            displayName: joinedPeer.data.displayName,
                            device: joinedPeer.data.device
                        }));
                        accept({ peers: peerInfos });
                        peer.data.joined = true;
                        for (const joinedPeer of joinedPeers) {
                            for (const producer of joinedPeer.data.producers.values()) {
                                this._createConsumer({
                                    consumerPeer: peer,
                                    producerPeer: joinedPeer,
                                    producer
                                });
                            }
                            for (const dataProducer of joinedPeer.data.dataProducers.values()) {
                                if (dataProducer.label === 'bot')
                                    continue;
                                this._createDataConsumer({
                                    dataConsumerPeer: peer,
                                    dataProducerPeer: joinedPeer,
                                    dataProducer
                                });
                            }
                        }
                        for (const otherPeer of this._getJoinedPeers({ excludePeer: peer })) {
                            otherPeer.notify('newPeer', {
                                id: peer.id,
                                displayName: peer.data.displayName,
                                device: peer.data.device
                            })
                                .catch(() => { });
                        }
                        break;
                    }
                case 'createWebRtcTransport':
                    {
                        const { forceTcp, producing, consuming, sctpCapabilities } = request.data;
                        const webRtcTransportOptions = Object.assign(Object.assign({}, config_1.default.mediasoup.webRtcTransportOptions), { enableSctp: Boolean(sctpCapabilities), numSctpStreams: (sctpCapabilities || {}).numStreams, appData: { producing, consuming }, enableUdp: true, enableTcp: true });
                        if (forceTcp) {
                            webRtcTransportOptions.enableUdp = false;
                            webRtcTransportOptions.enableTcp = true;
                        }
                        const transport = yield this._mediasoupRouter.createWebRtcTransport(webRtcTransportOptions);
                        transport.on('sctpstatechange', (sctpState) => {
                            console.log('WebRtcTransport "sctpstatechange" event [sctpState:%s]', sctpState);
                        });
                        transport.on('dtlsstatechange', (dtlsState) => {
                            if (dtlsState === 'failed' || dtlsState === 'closed')
                                console.log('WebRtcTransport "dtlsstatechange" event [dtlsState:%s]', dtlsState);
                        });
                        yield transport.enableTraceEvent(['bwe']);
                        transport.on('trace', (trace) => {
                            console.log('transport "trace" event [transportId:%s, trace.type:%s, trace:%o]', transport.id, trace.type, trace);
                            if (trace.type === 'bwe' && trace.direction === 'out') {
                                peer.notify('downlinkBwe', {
                                    desiredBitrate: trace.info.desiredBitrate,
                                    effectiveDesiredBitrate: trace.info.effectiveDesiredBitrate,
                                    availableBitrate: trace.info.availableBitrate
                                })
                                    .catch(() => { });
                            }
                        });
                        peer.data.transports.set(transport.id, transport);
                        accept({
                            id: transport.id,
                            iceParameters: transport.iceParameters,
                            iceCandidates: transport.iceCandidates,
                            dtlsParameters: transport.dtlsParameters,
                            sctpParameters: transport.sctpParameters
                        });
                        const { maxIncomingBitrate } = config_1.default.mediasoup.webRtcTransportOptions;
                        if (maxIncomingBitrate) {
                            try {
                                yield transport.setMaxIncomingBitrate(maxIncomingBitrate);
                            }
                            catch (error) { }
                        }
                        break;
                    }
                case 'connectWebRtcTransport':
                    {
                        const { transportId, dtlsParameters } = request.data;
                        const transport = peer.data.transports.get(transportId);
                        if (!transport)
                            throw new Error(`transport with id "${transportId}" not found`);
                        yield transport.connect({ dtlsParameters });
                        accept();
                        break;
                    }
                case 'restartIce':
                    {
                        const { transportId } = request.data;
                        const transport = peer.data.transports.get(transportId);
                        if (!transport)
                            throw new Error(`transport with id "${transportId}" not found`);
                        const iceParameters = yield transport.restartIce();
                        accept(iceParameters);
                        break;
                    }
                case 'produce':
                    {
                        if (!peer.data.joined)
                            throw new Error('Peer not yet joined');
                        const { transportId, kind, rtpParameters } = request.data;
                        let { appData } = request.data;
                        const transport = peer.data.transports.get(transportId);
                        if (!transport)
                            throw new Error(`transport with id "${transportId}" not found`);
                        appData = Object.assign(Object.assign({}, appData), { peerId: peer.id });
                        const producer = yield transport.produce({
                            kind,
                            rtpParameters,
                            appData
                        });
                        peer.data.producers.set(producer.id, producer);
                        producer.on('score', (score) => {
                            peer.notify('producerScore', { producerId: producer.id, score })
                                .catch(() => { });
                        });
                        producer.on('videoorientationchange', (videoOrientation) => {
                            console.log('producer "videoorientationchange" event [producerId:%s, videoOrientation:%o]', producer.id, videoOrientation);
                        });
                        producer.on('trace', (trace) => {
                            console.log('producer "trace" event [producerId:%s, trace.type:%s, trace:%o]', producer.id, trace.type, trace);
                        });
                        accept({ id: producer.id });
                        for (const otherPeer of this._getJoinedPeers({ excludePeer: peer })) {
                            this._createConsumer({
                                consumerPeer: otherPeer,
                                producerPeer: peer,
                                producer
                            });
                        }
                        if (producer.kind === 'audio') {
                            this._audioLevelObserver.addProducer({ producerId: producer.id })
                                .catch(() => { });
                        }
                        break;
                    }
                case 'closeProducer':
                    {
                        if (!peer.data.joined)
                            throw new Error('Peer not yet joined');
                        const { producerId } = request.data;
                        const producer = peer.data.producers.get(producerId);
                        if (!producer)
                            throw new Error(`producer with id "${producerId}" not found`);
                        producer.close();
                        peer.data.producers.delete(producer.id);
                        accept();
                        break;
                    }
                case 'pauseProducer':
                    {
                        if (!peer.data.joined)
                            throw new Error('Peer not yet joined');
                        const { producerId } = request.data;
                        const producer = peer.data.producers.get(producerId);
                        if (!producer)
                            throw new Error(`producer with id "${producerId}" not found`);
                        yield producer.pause();
                        accept();
                        break;
                    }
                case 'resumeProducer':
                    {
                        if (!peer.data.joined)
                            throw new Error('Peer not yet joined');
                        const { producerId } = request.data;
                        const producer = peer.data.producers.get(producerId);
                        if (!producer)
                            throw new Error(`producer with id "${producerId}" not found`);
                        yield producer.resume();
                        accept();
                        break;
                    }
                case 'pauseConsumer':
                    {
                        if (!peer.data.joined)
                            throw new Error('Peer not yet joined');
                        const { consumerId } = request.data;
                        const consumer = peer.data.consumers.get(consumerId);
                        if (!consumer)
                            throw new Error(`consumer with id "${consumerId}" not found`);
                        yield consumer.pause();
                        accept();
                        break;
                    }
                case 'resumeConsumer':
                    {
                        if (!peer.data.joined)
                            throw new Error('Peer not yet joined');
                        const { consumerId } = request.data;
                        const consumer = peer.data.consumers.get(consumerId);
                        if (!consumer)
                            throw new Error(`consumer with id "${consumerId}" not found`);
                        yield consumer.resume();
                        accept();
                        break;
                    }
                case 'setConsumerPreferredLayers':
                    {
                        if (!peer.data.joined)
                            throw new Error('Peer not yet joined');
                        const { consumerId, spatialLayer, temporalLayer } = request.data;
                        const consumer = peer.data.consumers.get(consumerId);
                        if (!consumer)
                            throw new Error(`consumer with id "${consumerId}" not found`);
                        yield consumer.setPreferredLayers({ spatialLayer, temporalLayer });
                        accept();
                        break;
                    }
                case 'setConsumerPriority':
                    {
                        if (!peer.data.joined)
                            throw new Error('Peer not yet joined');
                        const { consumerId, priority } = request.data;
                        const consumer = peer.data.consumers.get(consumerId);
                        if (!consumer)
                            throw new Error(`consumer with id "${consumerId}" not found`);
                        yield consumer.setPriority(priority);
                        accept();
                        break;
                    }
                case 'requestConsumerKeyFrame':
                    {
                        if (!peer.data.joined)
                            throw new Error('Peer not yet joined');
                        const { consumerId } = request.data;
                        const consumer = peer.data.consumers.get(consumerId);
                        if (!consumer)
                            throw new Error(`consumer with id "${consumerId}" not found`);
                        yield consumer.requestKeyFrame();
                        accept();
                        break;
                    }
                case 'produceData':
                    {
                        if (!peer.data.joined)
                            throw new Error('Peer not yet joined');
                        const { transportId, sctpStreamParameters, label, protocol, appData } = request.data;
                        const transport = peer.data.transports.get(transportId);
                        if (!transport)
                            throw new Error(`transport with id "${transportId}" not found`);
                        const dataProducer = yield transport.produceData({
                            sctpStreamParameters,
                            label,
                            protocol,
                            appData
                        });
                        peer.data.dataProducers.set(dataProducer.id, dataProducer);
                        accept({ id: dataProducer.id });
                        switch (dataProducer.label) {
                            case 'chat':
                                {
                                    for (const otherPeer of this._getJoinedPeers({ excludePeer: peer })) {
                                        this._createDataConsumer({
                                            dataConsumerPeer: otherPeer,
                                            dataProducerPeer: peer,
                                            dataProducer
                                        });
                                    }
                                    break;
                                }
                            case 'bot':
                                {
                                    console.log('bott');
                                    break;
                                }
                        }
                        break;
                    }
                case 'changeDisplayName':
                    {
                        if (!peer.data.joined)
                            throw new Error('Peer not yet joined');
                        const { displayName } = request.data;
                        const oldDisplayName = peer.data.displayName;
                        peer.data.displayName = displayName;
                        for (const otherPeer of this._getJoinedPeers({ excludePeer: peer })) {
                            otherPeer.notify('peerDisplayNameChanged', {
                                peerId: peer.id,
                                displayName,
                                oldDisplayName
                            })
                                .catch(() => { });
                        }
                        accept();
                        break;
                    }
                case 'getTransportStats':
                    {
                        const { transportId } = request.data;
                        const transport = peer.data.transports.get(transportId);
                        if (!transport)
                            throw new Error(`transport with id "${transportId}" not found`);
                        const stats = yield transport.getStats();
                        accept(stats);
                        break;
                    }
                case 'getProducerStats':
                    {
                        const { producerId } = request.data;
                        const producer = peer.data.producers.get(producerId);
                        if (!producer)
                            throw new Error(`producer with id "${producerId}" not found`);
                        const stats = yield producer.getStats();
                        accept(stats);
                        break;
                    }
                case 'getConsumerStats':
                    {
                        const { consumerId } = request.data;
                        const consumer = peer.data.consumers.get(consumerId);
                        if (!consumer)
                            throw new Error(`consumer with id "${consumerId}" not found`);
                        const stats = yield consumer.getStats();
                        accept(stats);
                        break;
                    }
                case 'getDataProducerStats':
                    {
                        const { dataProducerId } = request.data;
                        const dataProducer = peer.data.dataProducers.get(dataProducerId);
                        if (!dataProducer)
                            throw new Error(`dataProducer with id "${dataProducerId}" not found`);
                        const stats = yield dataProducer.getStats();
                        accept(stats);
                        break;
                    }
                case 'getDataConsumerStats':
                    {
                        const { dataConsumerId } = request.data;
                        const dataConsumer = peer.data.dataConsumers.get(dataConsumerId);
                        if (!dataConsumer)
                            throw new Error(`dataConsumer with id "${dataConsumerId}" not found`);
                        const stats = yield dataConsumer.getStats();
                        accept(stats);
                        break;
                    }
                case 'applyNetworkThrottle':
                    {
                        const DefaultUplink = 1000000;
                        const DefaultDownlink = 1000000;
                        const DefaultRtt = 0;
                        const { uplink, downlink, rtt, secret } = request.data;
                        if (!secret || secret !== process.env.NETWORK_THROTTLE_SECRET) {
                            reject(403, 'operation NOT allowed, modda fuckaa');
                            return;
                        }
                        try {
                            yield throttle_1.default.start({
                                up: uplink || DefaultUplink,
                                down: downlink || DefaultDownlink,
                                rtt: rtt || DefaultRtt
                            });
                            console.log('network throttle set [uplink:%s, downlink:%s, rtt:%s]', uplink || DefaultUplink, downlink || DefaultDownlink, rtt || DefaultRtt);
                            accept();
                        }
                        catch (error) {
                            console.error('network throttle apply failed: %o', error);
                            reject(500, error.toString());
                        }
                        break;
                    }
                case 'resetNetworkThrottle':
                    {
                        const { secret } = request.data;
                        if (!secret || secret !== process.env.NETWORK_THROTTLE_SECRET) {
                            reject(403, 'operation NOT allowed, modda fuckaa');
                            return;
                        }
                        try {
                            yield throttle_1.default.stop({});
                            console.log('network throttle stopped');
                            accept();
                        }
                        catch (error) {
                            console.error('network throttle stop failed: %o', error);
                            reject(500, error.toString());
                        }
                        break;
                    }
                default:
                    {
                        console.error('unknown request.method "%s"', request.method);
                        reject(500, `unknown request.method "${request.method}"`);
                    }
            }
        });
    }
    _getJoinedPeers({ excludePeer = undefined } = {}) {
        return this._protooRoom.peers
            .filter((peer) => peer.data.joined && peer !== excludePeer);
    }
    _createConsumer(createCon) {
        return __awaiter(this, void 0, void 0, function* () {
            const { consumerPeer, producer, producerPeer } = createCon;
            if (!consumerPeer.data.rtpCapabilities ||
                !this._mediasoupRouter.canConsume({
                    producerId: producer.id,
                    rtpCapabilities: consumerPeer.data.rtpCapabilities
                })) {
                return;
            }
            let transport;
            transport = Array.from(consumerPeer.data.transports.values())
                .find((t) => t.appData.consuming);
            if (!transport) {
                console.log('_createConsumer() | Transport for consuming not found');
                return;
            }
            let consumer;
            try {
                consumer = yield transport.consume({
                    producerId: producer.id,
                    rtpCapabilities: consumerPeer.data.rtpCapabilities,
                    paused: true
                });
            }
            catch (error) {
                console.log('_createConsumer() | transport.consume():%o', error);
                return;
            }
            consumerPeer.data.consumers.set(consumer.id, consumer);
            consumer.on('transportclose', () => {
                consumerPeer.data.consumers.delete(consumer.id);
            });
            consumer.on('producerclose', () => {
                consumerPeer.data.consumers.delete(consumer.id);
                consumerPeer.notify('consumerClosed', { consumerId: consumer.id })
                    .catch(() => { });
            });
            consumer.on('producerpause', () => {
                consumerPeer.notify('consumerPaused', { consumerId: consumer.id })
                    .catch(() => { });
            });
            consumer.on('producerresume', () => {
                consumerPeer.notify('consumerResumed', { consumerId: consumer.id })
                    .catch(() => { });
            });
            consumer.on('score', (score) => {
                consumerPeer.notify('consumerScore', { consumerId: consumer.id, score })
                    .catch(() => { });
            });
            consumer.on('layerschange', (layers) => {
                consumerPeer.notify('consumerLayersChanged', {
                    consumerId: consumer.id,
                    spatialLayer: layers ? layers.spatialLayer : null,
                    temporalLayer: layers ? layers.temporalLayer : null
                })
                    .catch(() => { });
            });
            consumer.on('trace', (trace) => {
                console.log('consumer "trace" event [producerId:%s, trace.type:%s, trace:%o]', consumer.id, trace.type, trace);
            });
            try {
                yield consumerPeer.request('newConsumer', {
                    peerId: producerPeer.id,
                    producerId: producer.id,
                    id: consumer.id,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                    type: consumer.type,
                    appData: producer.appData,
                    producerPaused: consumer.producerPaused
                });
                yield consumer.resume();
                consumerPeer.notify('consumerScore', {
                    consumerId: consumer.id,
                    score: consumer.score
                })
                    .catch(() => { });
            }
            catch (error) {
                console.log('_createConsumer() | failed:%o', error);
            }
        });
    }
    _createDataConsumer(createDataCon) {
        return __awaiter(this, void 0, void 0, function* () {
            const { dataConsumerPeer, dataProducer, dataProducerPeer } = createDataCon;
            if (!dataConsumerPeer.data.sctpCapabilities)
                return;
            let transport;
            transport = Array.from(dataConsumerPeer.data.transports.values())
                .find((t) => t.appData.consuming);
            if (!transport) {
                console.log('_createDataConsumer() | Transport for consuming not found');
                return;
            }
            let dataConsumer;
            try {
                dataConsumer = yield transport.consumeData({
                    dataProducerId: dataProducer.id
                });
            }
            catch (error) {
                console.log('_createDataConsumer() | transport.consumeData():%o', error);
                return;
            }
            dataConsumerPeer.data.dataConsumers.set(dataConsumer.id, dataConsumer);
            dataConsumer.on('transportclose', () => {
                dataConsumerPeer.data.dataConsumers.delete(dataConsumer.id);
            });
            dataConsumer.on('dataproducerclose', () => {
                dataConsumerPeer.data.dataConsumers.delete(dataConsumer.id);
                dataConsumerPeer.notify('dataConsumerClosed', { dataConsumerId: dataConsumer.id })
                    .catch(() => { });
            });
            try {
                yield dataConsumerPeer.request('newDataConsumer', {
                    peerId: dataProducerPeer ? dataProducerPeer.id : null,
                    dataProducerId: dataProducer.id,
                    id: dataConsumer.id,
                    sctpStreamParameters: dataConsumer.sctpStreamParameters,
                    label: dataConsumer.label,
                    protocol: dataConsumer.protocol,
                    appData: dataProducer.appData
                });
            }
            catch (error) {
                console.log('_createDataConsumer() | failed:%o', error);
            }
        });
    }
}
exports.default = Room;
//# sourceMappingURL=Room.js.map