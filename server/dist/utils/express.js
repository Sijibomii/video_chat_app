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
exports.rooms = exports.expressApp = exports.createExpressApp = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
let expressApp;
exports.expressApp = expressApp;
const rooms = new Map();
exports.rooms = rooms;
const createExpressApp = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('creating Express app...');
    exports.expressApp = expressApp = express_1.default();
    expressApp.use(body_parser_1.urlencoded());
    expressApp.param('roomId', (req, _, next, roomId) => {
        if (!rooms.has(roomId)) {
            const error = new Error(`room with id "${roomId}" not found`);
            throw error;
        }
        req.room = rooms.get(roomId);
        next();
    });
    expressApp.get('/rooms/:roomId', (req, res) => {
        const data = req.room.getRouterRtpCapabilities();
        res.status(200).json(data);
    });
    expressApp.post('/rooms/:roomId/broadcasters', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { id, displayName, device, rtpCapabilities } = req.body;
        try {
            const data = yield req.room.createBroadcaster({
                id,
                displayName,
                device,
                rtpCapabilities
            });
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    }));
    expressApp.delete('/rooms/:roomId/broadcasters/:broadcasterId', (req, res) => {
        const { broadcasterId } = req.params;
        req.room.deleteBroadcaster({ broadcasterId });
        res.status(200).send('broadcaster deleted');
    });
    expressApp.post('/rooms/:roomId/broadcasters/:broadcasterId/transports', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { broadcasterId } = req.params;
        const { type, rtcpMux, comedia, sctpCapabilities } = req.body;
        try {
            const data = yield req.room.createBroadcasterTransport({
                broadcasterId,
                type,
                rtcpMux,
                comedia,
                sctpCapabilities
            });
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    }));
    expressApp.post('/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/connect', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { broadcasterId, transportId } = req.params;
        const { dtlsParameters } = req.body;
        try {
            const data = yield req.room.connectBroadcasterTransport({
                broadcasterId,
                transportId,
                dtlsParameters
            });
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    }));
    expressApp.post('/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/producers', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { broadcasterId, transportId } = req.params;
        const { kind, rtpParameters } = req.body;
        try {
            const data = yield req.room.createBroadcasterProducer({
                broadcasterId,
                transportId,
                kind,
                rtpParameters
            });
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    }));
    expressApp.post('/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { broadcasterId, transportId } = req.params;
        const { producerId } = req.query;
        try {
            const data = yield req.room.createBroadcasterConsumer({
                broadcasterId,
                transportId,
                producerId
            });
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    }));
    expressApp.post('/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume/data', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { broadcasterId, transportId } = req.params;
        const { dataProducerId } = req.body;
        try {
            const data = yield req.room.createBroadcasterDataConsumer({
                broadcasterId,
                transportId,
                dataProducerId
            });
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    }));
    expressApp.post('/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/produce/data', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const { broadcasterId, transportId } = req.params;
        const { label, protocol, sctpStreamParameters, appData } = req.body;
        try {
            const data = yield req.room.createBroadcasterDataProducer({
                broadcasterId,
                transportId,
                label,
                protocol,
                sctpStreamParameters,
                appData
            });
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    }));
    expressApp.use((error, _, res, next) => {
        if (error) {
            console.log('Express app %s', String(error));
            res.statusMessage = error.message;
            res.status((error.name === 'TypeError' ? 400 : 500)).send(String(error));
        }
        else {
            next();
        }
    });
});
exports.createExpressApp = createExpressApp;
//# sourceMappingURL=express.js.map