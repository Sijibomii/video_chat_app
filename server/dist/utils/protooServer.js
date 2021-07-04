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
exports.protooWebSocketServer = exports.runProtooWebSocketServer = void 0;
const protoo_server_1 = __importDefault(require("protoo-server"));
const http_1 = require("./http");
const url_1 = __importDefault(require("url"));
const awaitqueue_1 = require("awaitqueue");
const express_1 = require("./express");
const mediasoupWorkers_1 = require("./mediasoupWorkers");
const Room_1 = __importDefault(require("./Room"));
let nextMediasoupWorkerIdx = 0;
const queue = new awaitqueue_1.AwaitQueue();
let protooWebSocketServer;
exports.protooWebSocketServer = protooWebSocketServer;
const runProtooWebSocketServer = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('running protoo WebSocketServer...');
    exports.protooWebSocketServer = protooWebSocketServer = new protoo_server_1.default.WebSocketServer(http_1.httpsServer, {
        maxReceivedFrameSize: 960000,
        maxReceivedMessageSize: 960000,
        fragmentOutgoingMessages: true,
        fragmentationThreshold: 960000
    });
    protooWebSocketServer.on('connectionrequest', (info, accept, reject) => {
        const u = url_1.default.parse(info.request.url, true);
        let roomId;
        roomId = u.query['roomId'].toString();
        const peerId = u.query['peerId'];
        if (!roomId || !peerId) {
            reject(400, 'Connection request without roomId and/or peerId');
            return;
        }
        console.log('protoo connection request [roomId:%s, peerId:%s, address:%s, origin:%s]', roomId, peerId, info.socket.remoteAddress, info.origin);
        queue.push(() => __awaiter(void 0, void 0, void 0, function* () {
            const room = yield getOrCreateRoom({ roomId });
            const protooWebSocketTransport = accept();
            room.handleProtooConnection({ peerId, protooWebSocketTransport });
        }))
            .catch((error) => {
            console.error('room creation or room joining failed:%o', error);
            reject(error);
        });
    });
});
exports.runProtooWebSocketServer = runProtooWebSocketServer;
function getMediasoupWorker() {
    const worker = mediasoupWorkers_1.mediasoupWorkers[nextMediasoupWorkerIdx];
    if (++nextMediasoupWorkerIdx === mediasoupWorkers_1.mediasoupWorkers.length)
        nextMediasoupWorkerIdx = 0;
    return worker;
}
function getOrCreateRoom(getOrCreateRoom) {
    return __awaiter(this, void 0, void 0, function* () {
        const { roomId } = getOrCreateRoom;
        let room = express_1.rooms.get(roomId);
        if (!room) {
            console.log('creating a new Room [roomId:%s]', roomId);
            const mediasoupWorker = getMediasoupWorker();
            room = yield Room_1.default.create({ mediasoupWorker, roomId });
            express_1.rooms.set(roomId, room);
            room.on('close', () => express_1.rooms.delete(roomId));
        }
        return room;
    });
}
//# sourceMappingURL=protooServer.js.map