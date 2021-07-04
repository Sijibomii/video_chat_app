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
Object.defineProperty(exports, "__esModule", { value: true });
const mediasoupWorkers_1 = require("./utils/mediasoupWorkers");
const express_1 = require("./utils/express");
const http_1 = require("./utils/http");
const protooServer_1 = require("./utils/protooServer");
run();
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mediasoupWorkers_1.runMediasoupWorkers();
        yield express_1.createExpressApp();
        yield http_1.runHttpsServer();
        yield protooServer_1.runProtooWebSocketServer();
        setInterval(() => {
            for (const room of express_1.rooms.values()) {
                room.logStatus();
            }
        }, 120000);
    });
}
//# sourceMappingURL=server.js.map