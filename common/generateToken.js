"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (payload, expiryTime) => {
    const AccessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "";
    const TokenExpiry = process.env.TOKEN_EXPIRY || "30";
    const token = jsonwebtoken_1.default.sign(payload, AccessTokenSecret, { expiresIn: expiryTime || `${TokenExpiry}d` });
    return token;
};
exports.default = generateToken;
//# sourceMappingURL=generateToken.js.map