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
exports.runHttpsServer = exports.httpsServer = void 0;
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const config_1 = __importDefault(require("./config"));
const express_1 = require("./express");
let httpsServer;
exports.httpsServer = httpsServer;
const runHttpsServer = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('running an HTTPS server...');
    const tls = {
        cert: fs_1.default.readFileSync(config_1.default.https.tls.cert),
        key: fs_1.default.readFileSync(config_1.default.https.tls.key)
    };
    exports.httpsServer = httpsServer = https_1.default.createServer(tls, express_1.expressApp);
    yield new Promise((resolve) => {
        httpsServer.listen(Number(config_1.default.https.listenPort), config_1.default.https.listenIp, resolve);
    });
});
exports.runHttpsServer = runHttpsServer;
//# sourceMappingURL=http.js.map