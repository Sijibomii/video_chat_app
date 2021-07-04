"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const Config = {
    https: {
        listenIp: '0.0.0.0',
        listenPort: process.env.PROTOO_LISTEN_PORT || 4443,
        tls: {
            cert: process.env.HTTPS_CERT_FULLCHAIN || `${__dirname}/certs/cert.pem`,
            key: process.env.HTTPS_CERT_PRIVKEY || `${__dirname}/certs/key.pem`
        }
    },
    mediasoup: {
        numWorkers: Object.keys(os_1.default.cpus()).length,
        workerSettings: {
            logLevel: 'warn',
            logTags: [
                'info',
                'ice',
                'dtls',
                'rtp',
                'srtp',
                'rtcp',
                'rtx',
                'bwe',
                'score',
                'simulcast',
                'svc',
                'sctp'
            ],
            rtcMinPort: process.env.MEDIASOUP_MIN_PORT || 40000,
            rtcMaxPort: process.env.MEDIASOUP_MAX_PORT || 49999
        },
        routerOptions: {
            mediaCodecs: [
                {
                    kind: 'audio',
                    mimeType: 'audio/opus',
                    clockRate: 48000,
                    channels: 2
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP8',
                    clockRate: 90000,
                    parameters: {
                        'x-google-start-bitrate': 1000
                    }
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP9',
                    clockRate: 90000,
                    parameters: {
                        'profile-id': 2,
                        'x-google-start-bitrate': 1000
                    }
                },
                {
                    kind: 'video',
                    mimeType: 'video/h264',
                    clockRate: 90000,
                    parameters: {
                        'packetization-mode': 1,
                        'profile-level-id': '4d0032',
                        'level-asymmetry-allowed': 1,
                        'x-google-start-bitrate': 1000
                    }
                },
                {
                    kind: 'video',
                    mimeType: 'video/h264',
                    clockRate: 90000,
                    parameters: {
                        'packetization-mode': 1,
                        'profile-level-id': '42e01f',
                        'level-asymmetry-allowed': 1,
                        'x-google-start-bitrate': 1000
                    }
                }
            ]
        },
        webRtcTransportOptions: {
            listenIps: [
                {
                    ip: process.env.MEDIASOUP_LISTEN_IP || '1.2.3.4',
                    announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP
                }
            ],
            initialAvailableOutgoingBitrate: 1000000,
            minimumAvailableOutgoingBitrate: 600000,
            maxSctpMessageSize: 262144,
            maxIncomingBitrate: 1500000
        },
        plainTransportOptions: {
            listenIp: {
                ip: process.env.MEDIASOUP_LISTEN_IP || '1.2.3.4',
                announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP
            },
            maxSctpMessageSize: 262144
        }
    }
};
exports.default = Config;
//# sourceMappingURL=config.js.map