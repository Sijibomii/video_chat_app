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
exports.runMediasoupWorkers = exports.mediasoupWorkers = void 0;
const config_1 = __importDefault(require("./config"));
const mediasoup_1 = __importDefault(require("mediasoup"));
exports.mediasoupWorkers = [];
const runMediasoupWorkers = () => __awaiter(void 0, void 0, void 0, function* () {
    const { numWorkers } = config_1.default.mediasoup;
    console.log('running %d mediasoup Workers...', numWorkers);
    for (let i = 0; i < numWorkers; ++i) {
        const worker = yield mediasoup_1.default.createWorker({
            logLevel: (config_1.default.mediasoup.workerSettings.logLevel),
            logTags: (config_1.default.mediasoup.workerSettings.logTags),
            rtcMinPort: Number(config_1.default.mediasoup.workerSettings.rtcMinPort),
            rtcMaxPort: Number(config_1.default.mediasoup.workerSettings.rtcMaxPort)
        });
        worker.on('died', () => {
            console.error('mediasoup Worker died, exiting  in 2 seconds... [pid:%d]', worker.pid);
            setTimeout(() => process.exit(1), 2000);
        });
        exports.mediasoupWorkers.push(worker);
        setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            const usage = yield worker.getResourceUsage();
            console.log('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
        }), 120000);
    }
});
exports.runMediasoupWorkers = runMediasoupWorkers;
//# sourceMappingURL=mediasoupWorkers.js.map