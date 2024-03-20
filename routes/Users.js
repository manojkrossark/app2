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
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
const express_1 = require("express");
const nanoid_1 = require("nanoid");
const mail_1 = __importDefault(require("@sendgrid/mail"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logLevels_1 = __importDefault(require("../constants/logLevels"));
const logger_1 = require("../common/logger");
const constants_1 = require("../constants");
const User_1 = __importDefault(require("../models/User"));
const Room_1 = __importDefault(require("../models/Room"));
const generateToken_1 = __importDefault(require("../common/generateToken"));
const passwordResetController_1 = __importDefault(require("../controllers/passwordResetController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const router = (0, express_1.Router)();
router.post("/register-user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { uid, fullName, email, password, photoUrl, isGoogleSignIn, isPasswordSet } = req.body;
        if (!email) {
            res.status(404).json({ field: "email", message: "Please provide email to register user" });
            return;
        }
        const foundUser = yield User_1.default.findOne({ email });
        if (foundUser) {
            if (foundUser.isGoogleSignIn) {
                res.status(404).json({ field: "email", message: "The user already exists" });
                return;
            }
            if (!isGoogleSignIn && foundUser.password) {
                res.status(404).json({ field: "email", message: "The user already exists" });
                return;
            }
            if ((!foundUser.password && !foundUser.isGoogleSignIn) || (foundUser.password && isGoogleSignIn)) {
                if (password) {
                    const cryptPassword = bcrypt.hashSync(password, constants_1.SALT_ROUNDS);
                    foundUser.$set(`password`, cryptPassword);
                    foundUser.$set("isPasswordSet", true);
                }
                if (isGoogleSignIn) {
                    foundUser.$set("isGoogleSignIn", isGoogleSignIn);
                }
                if (fullName) {
                    foundUser.$set(`fullName`, fullName);
                }
                yield foundUser.save();
                res.status(200).json({ message: "Successfully created user" });
                return;
            }
        }
        let hashPassword = "";
        if (password) {
            hashPassword = bcrypt.hashSync(password, constants_1.SALT_ROUNDS);
        }
        const user = new User_1.default({
            uid,
            fullName,
            email,
            password: hashPassword,
            photoUrl,
            isActive: true,
            isGoogleSignIn,
            isPasswordSet,
        });
        yield user.save();
        res.status(200).json({ message: "Successfully created user" });
    }
    catch (err) {
        res.status(404).json({ message: err });
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to register user", { method: `${req.method} ${req.url}`, err, body: req.body });
    }
}));
const updateRoom = (roomId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const foundRoom = yield Room_1.default.findOne({ roomId });
        if (!foundRoom) {
            return;
        }
        if (Object.keys(foundRoom.roles).includes(payload.uid)) {
            return;
        }
        if (payload) {
            const r = payload;
            foundRoom.$set(`roles.${r.uid}`, r);
        }
        yield foundRoom.save();
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to update roles", {
            method: "sendInvites",
            err,
            body: { roomId, payload },
        });
        throw new Error(`Failed to update roles`);
    }
});
const sendInvites = (uid, roomId, mailFrom, mailTo) => __awaiter(void 0, void 0, void 0, function* () {
    const ApplicationUrl = process.env.APPLICATION_WEBSITE_URL || "http://localhost:3000/";
    const ApplicationName = process.env.APPLICATION_NAME || "Slate";
    const mailOptions = {
        from: mailFrom,
        to: mailTo,
        subject: `Invited to ${ApplicationName} room`,
        html: `<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Project Room Invitation</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
    
      <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; padding-bottom: 20px;">
          <h2>Project Room Invitation</h2>
          <p>You are invited to join the project room.</p>
        </div>
        
        <div style="text-align: center;">
          <a href=${ApplicationUrl}register?uid=${uid}&room=${roomId} style="display: inline-block; font-size: 16px; padding: 10px 20px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 4px;">Join Project Room</a>
        </div>
      </div>
    </body>
    </html>`,
    };
    try {
        yield mail_1.default.send(mailOptions);
    }
    catch (error) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to send invite mail", {
            method: "sendInvites",
            error,
            body: { uid, roomId, mailTo },
        });
        throw new Error(`Error sending email - ${error}`);
    }
});
router.post("/invite-users", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { users } = req.body;
        if (!users || (users && (users === null || users === void 0 ? void 0 : users.length) === 0)) {
            res.status(404).json({ message: "User is not required" });
            return;
        }
        users === null || users === void 0 ? void 0 : users.forEach((user) => __awaiter(void 0, void 0, void 0, function* () {
            if (!(user === null || user === void 0 ? void 0 : user.email)) {
                res.status(404).json("Please provide email to register user");
                return;
            }
            const { roomId } = user;
            const name = (user === null || user === void 0 ? void 0 : user.displayName) || user.email.split("@")[0];
            const rolesPayload = { uid: user.uid, name, role: user.role, email: user.email };
            const foundUser = yield User_1.default.findOne({ email: user === null || user === void 0 ? void 0 : user.email });
            if (foundUser) {
                rolesPayload.uid = foundUser.uid;
                updateRoom(roomId, rolesPayload);
                sendInvites(foundUser.uid, roomId, user.from, user.email);
                return;
            }
            const newUser = new User_1.default({
                uid: user.uid,
                fullName: "",
                email: user.email,
                password: "",
                photoUrl: "",
                isActive: true,
                isGoogleSignIn: false,
                isPasswordSet: false,
            });
            yield newUser.save();
            updateRoom(roomId, rolesPayload);
            sendInvites(user.uid, roomId, user.from, user.email);
        }));
        res.status(200).send({ message: "Room shared successfully" });
    }
    catch (err) {
        res.status(404).json(err);
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to update user", { method: `${req.method} ${req.url}`, err, body: req.body });
    }
}));
router.patch("/update-user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { uid, password, fullName } = req.body;
        if (!uid) {
            res.status(404).json("uid is required to update user");
            return;
        }
        const foundUser = yield User_1.default.findOne({ uid });
        if (!foundUser) {
            res.status(404).json("Could not find the user.");
            return;
        }
        if (password) {
            let hashPassword = "";
            hashPassword = bcrypt.hashSync(password, constants_1.SALT_ROUNDS);
            foundUser.$set(`password`, hashPassword);
            foundUser.$set("isPasswordSet", true);
        }
        if (fullName) {
            foundUser.$set(`fullName`, fullName);
        }
        yield foundUser.save();
        res.status(200).json("Successfully updated user.");
    }
    catch (err) {
        res.status(404).json(err);
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to update user", { method: `${req.method} ${req.url}`, err, body: req.body });
    }
}));
router.get("/get-user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, uid } = req.query;
        if (!email && !uid) {
            res.status(404).json("Email or uid is required");
            return;
        }
        let foundUser;
        if (email) {
            foundUser = yield User_1.default.findOne({ email });
        }
        if (uid) {
            foundUser = yield User_1.default.findOne({ uid });
        }
        if (!foundUser || Object.values(foundUser).length === 0) {
            res.status(404).send({ message: "User not found" });
            return;
        }
        res.status(200).json(foundUser);
    }
    catch (err) {
        res.status(404).json(err);
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to get user", { method: `${req.method} ${req.url}`, err, query: req.query });
    }
}));
const generateUserAccessToken = (userData) => {
    try {
        const user = {
            uid: userData.uid,
            displayName: userData.fullName || "",
            email: userData.email,
            photoUrl: userData.photoUrl,
            accessToken: (0, generateToken_1.default)({ email: userData.email }),
        };
        return user;
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to generate access token", {
            method: "generateUserAccessToken",
            err,
            body: userData.email,
        });
    }
};
const verifyGoogleToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // eslint-disable-next-line prefer-destructuring
        const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = yield client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        return { payload: ticket.getPayload() };
    }
    catch (error) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to verify google token", {
            method: "verifyGoogleToken",
            error,
        });
        return { error: "Invalid user detected. Please try again" };
    }
});
router.post("/google-signIn", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { credential } = req.body;
        if (credential) {
            const verificationResponse = yield verifyGoogleToken(credential);
            if (verificationResponse.error) {
                res.status(400).json({
                    message: verificationResponse.error,
                });
                return;
            }
            const userProfile = verificationResponse === null || verificationResponse === void 0 ? void 0 : verificationResponse.payload;
            const foundUser = yield User_1.default.findOne({ email: userProfile.email });
            const parsedUser = foundUser && JSON.parse(JSON.stringify(foundUser));
            if (parsedUser && (parsedUser === null || parsedUser === void 0 ? void 0 : parsedUser.email) === userProfile.email) {
                const user = generateUserAccessToken(parsedUser);
                res.status(200).json(user);
                (0, logger_1.logWithData)(logLevels_1.default.Info, "Login Successfully", {
                    method: `${req.method} ${req.url}`,
                    body: { email: parsedUser.email },
                });
                return;
            }
            const registerUser = new User_1.default({
                uid: (0, nanoid_1.nanoid)(),
                fullName: userProfile.name,
                email: userProfile.email,
                password: "",
                photoUrl: userProfile.picture,
                isActive: true,
                isGoogleSignIn: true,
                isPasswordSet: false,
            });
            yield registerUser.save();
            const parsedRegisterUser = JSON.parse(JSON.stringify(registerUser));
            const user = generateUserAccessToken(parsedRegisterUser);
            res.status(200).json(user);
            (0, logger_1.logWithData)(logLevels_1.default.Info, "Login Successfully", {
                method: `${req.method} ${req.url}`,
                body: { email: parsedRegisterUser === null || parsedRegisterUser === void 0 ? void 0 : parsedRegisterUser.email },
            });
        }
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Login failed", { method: `${req.method} ${req.url}`, err });
    }
}));
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const foundUser = yield User_1.default.findOne({ email });
        if (!foundUser || Object.values(foundUser).length === 0) {
            res.status(404).send({ message: "User not found" });
            return;
        }
        const parsedUser = JSON.parse(JSON.stringify(foundUser));
        const isValidPassword = bcrypt.compareSync(password, foundUser === null || foundUser === void 0 ? void 0 : foundUser.password);
        if (!isValidPassword) {
            res.status(404).send({ message: "Entered password doesn't match" });
            return;
        }
        const user = generateUserAccessToken(parsedUser);
        res.status(200).json(user);
        (0, logger_1.logWithData)(logLevels_1.default.Info, "Login Successfully", {
            method: `${req.method} ${req.url}`,
            body: { email: req.body.email },
        });
    }
    catch (err) {
        res.status(404).json(err);
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Login Failed", {
            method: `${req.method} ${req.url}`,
            err,
            body: { email: req.body.email },
        });
    }
}));
router.patch("/update-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const foundUser = yield User_1.default.findOne({ email });
        if (!foundUser || Object.values(foundUser).length === 0) {
            res.status(404).send({ message: "User not found" });
            return;
        }
        if (!password) {
            res.status(404).send({ message: "Can't save empty password" });
            return;
        }
        const hashPassword = bcrypt.hashSync(password, constants_1.SALT_ROUNDS);
        foundUser.$set(`password`, hashPassword);
        yield foundUser.save();
        res.status(200).send({ message: "Password updated successfully" });
    }
    catch (error) {
        res.status(404).json(error);
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Login Failed", {
            method: `${req.method} ${req.url}`,
            error,
            body: req.body,
        });
    }
}));
router.post("/forgot-password", passwordResetController_1.default);
router.get("/check-reset-token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const accessToken = (_a = req.query) === null || _a === void 0 ? void 0 : _a.token;
        const AccessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "";
        if (!accessToken) {
            res.status(401).json({ message: "Authorization token is required" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(accessToken, AccessTokenSecret);
        const expiryTime = decoded.exp * 1000;
        const currentTime = Date.now();
        if (expiryTime < currentTime) {
            res.status(401).json({ message: "Token is expired" });
            return;
        }
        res.status(200).json({ email: decoded === null || decoded === void 0 ? void 0 : decoded.email });
    }
    catch (error) {
        res.status(404).json(error);
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to validate reset password token", {
            method: `${req.method} ${req.url}`,
            error,
            body: req.query,
        });
    }
}));
exports.default = router;
//# sourceMappingURL=Users.js.map