"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = exports.validateTokenExpiration = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validateTokenExpiration = (req, res, next) => {
    var _a;
    const AccessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "";
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Authorization token is required" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, AccessTokenSecret);
        const expiryTime = decoded.exp * 1000;
        const currentTime = Date.now();
        if (expiryTime < currentTime) {
            return res.status(401).json({ message: "Token is expired" });
        }
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.validateTokenExpiration = validateTokenExpiration;
const authenticateUser = (req, res, next) => {
    var _a;
    const AccessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "";
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Missing token" });
    }
    jsonwebtoken_1.default.verify(token, AccessTokenSecret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
        req.body.userInfo = decoded;
        next();
    });
};
exports.authenticateUser = authenticateUser;
//# sourceMappingURL=authMiddleware.js.map