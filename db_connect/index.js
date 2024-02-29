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
exports.dbConnect = void 0;
/* eslint-disable import/prefer-default-export */
const mongoose_1 = require("mongoose");
const dbConnect = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mongoURI = process.env.MONGODB_URI || "";
        yield (0, mongoose_1.connect)(mongoURI);
        console.log("MongoDB database connected...");
    }
    catch (err) {
        console.warn("Database connection error:", err);
    }
});
exports.dbConnect = dbConnect;
//# sourceMappingURL=index.js.map