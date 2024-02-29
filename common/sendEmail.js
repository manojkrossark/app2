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
// sendEmail.ts
const mail_1 = __importDefault(require("@sendgrid/mail"));
const logger_1 = require("./logger");
const logLevels_1 = __importDefault(require("../constants/logLevels"));
const sendEmail = (mailData, isMultiple = false) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (isMultiple) {
            yield mail_1.default.sendMultiple(mailData);
            (0, logger_1.logWithData)(logLevels_1.default.Info, "Mail sent successfully", { function: "sendEmail", body: mailData });
            return;
        }
        yield mail_1.default.send(mailData);
        (0, logger_1.logWithData)(logLevels_1.default.Info, "Mail sent successfully", { function: "sendEmail", body: mailData });
    }
    catch (error) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to send invite mail", {
            method: "sendInvites",
            error,
            body: mailData,
        });
        throw error;
    }
});
exports.default = sendEmail;
//# sourceMappingURL=sendEmail.js.map