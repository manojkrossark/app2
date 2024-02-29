"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWithData = exports.logger = void 0;
/* eslint-disable import/no-extraneous-dependencies */
const winston_1 = __importDefault(require("winston"));
const winston_mongodb_1 = require("winston-mongodb");
// Winston logger configuration
const logger = winston_1.default.createLogger({
    level: "info",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json(), winston_1.default.format.metadata()),
    transports: [
        // new winston.transports.Console(),
        new winston_mongodb_1.MongoDB({
            db: process.env.MONGODB_URI || "mongodb://localhost:27017/TestDb",
            options: {
                useUnifiedTopology: true,
            },
            collection: "logs",
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
        }),
    ],
});
exports.logger = logger;
const logWithData = (level, message, meta = {}) => {
    logger.log(Object.assign({ level,
        message }, meta));
};
exports.logWithData = logWithData;
//# sourceMappingURL=logger.js.map