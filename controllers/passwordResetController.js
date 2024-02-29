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
const sendEmail_1 = __importDefault(require("../common/sendEmail"));
const generateToken_1 = __importDefault(require("../common/generateToken"));
const logger_1 = require("../common/logger");
const logLevels_1 = __importDefault(require("../constants/logLevels"));
const User_1 = __importDefault(require("../models/User"));
const passwordResetController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const foundUser = yield User_1.default.findOne({ email });
        if (!foundUser || Object.values(foundUser).length === 0) {
            res.status(404).send({ message: "User not found" });
            return;
        }
        const ApplicationUrl = process.env.APPLICATION_WEBSITE_URL || "http://localhost:3000/";
        const ApplicationName = process.env.APPLICATION_NAME || "Slate";
        const SenderMail = process.env.FROM_MAIL_ID || "no-replyslatedev@krossark.com";
        const token = (0, generateToken_1.default)({ email }, "15m");
        const mailData = {
            from: SenderMail,
            to: email,
            subject: " Reset Your Password",
            html: `
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>${ApplicationName}<h1>      
      <h2>Password Reset Request</h2>
      <p>Do not share this email. This is a one-time link to reset your password and it will only be valid for 15 minutes</p>
      <p>Please click the following link to reset your password:</p>
      <p><a href="${ApplicationUrl}reset-password?token=${token}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>If you didn't request this password reset, please contact the admin</p>
      <p>Thank you!</p>
    </div>
  
  </body>
  </html>
    `,
        };
        yield (0, sendEmail_1.default)(mailData);
        res.status(200).json({ message: "Password reset email sent successfully" });
        (0, logger_1.logWithData)(logLevels_1.default.Info, "Password reset mail sent successfully", {
            method: `${req.method} ${req.url}`,
            body: req.body,
        });
    }
    catch (error) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to send password reset mail", {
            method: `${req.method} ${req.url}`,
            error,
            body: req === null || req === void 0 ? void 0 : req.body,
        });
        res.status(500).json({ error: "Failed to send password reset email" });
    }
});
exports.default = passwordResetController;
//# sourceMappingURL=passwordResetController.js.map