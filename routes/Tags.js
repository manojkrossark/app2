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
const express_1 = require("express");
const Tag_1 = __importDefault(require("../models/Tag"));
const logger_1 = require("../common/logger");
const logLevels_1 = __importDefault(require("../constants/logLevels"));
const fetchIcons_1 = require("../utils/fetchIcons");
const router = (0, express_1.Router)();
router.post("/get-tags", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { keyword } = req.body;
        if (!keyword) {
            res.status(404).json("Keyword is not provided.");
            return;
        }
        const data = yield Tag_1.default.find({ tag: new RegExp(keyword, "i") });
        const parsedData = JSON.parse(JSON.stringify(data));
        const promises = (_a = parsedData[0].imageUrls) === null || _a === void 0 ? void 0 : _a.map((image) => __awaiter(void 0, void 0, void 0, function* () {
            const base64Data = yield (0, fetchIcons_1.fetchData)(image);
            return base64Data;
        }));
        const results = yield Promise.all(promises);
        res.status(200).json(results !== null && results !== void 0 ? results : {});
    }
    catch (error) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "get tags failed", { method: `${req.method} ${req.url}`, error });
    }
}));
exports.default = router;
//# sourceMappingURL=Tags.js.map