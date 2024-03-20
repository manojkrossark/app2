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
const express_1 = require("express");
const json_diff_1 = require("json-diff");
const Room_1 = __importDefault(require("../models/Room"));
const logger_1 = require("../common/logger");
const logLevels_1 = __importDefault(require("../constants/logLevels"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post("/create-room", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId, projectName, roles, nodes, publicNotes, requestedUsers } = req.body;
        if (!roomId || !projectName || !roles) {
            res.status(404).json("Please provide roomId or project name or roles.");
            return;
        }
        const room = new Room_1.default({ roomId, projectName, roles, nodes, publicNotes, requestedUsers });
        // room.$set(`roles.${roles.uid}`, roles);
        yield room.save();
        res.status(200).json({ room, message: "Successfully created room" });
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to create room", { method: `${req.method} ${req.url}`, err, body: req === null || req === void 0 ? void 0 : req.body });
    }
}));
router.post("/get-room", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (!findedRoom) {
            res.status(404).json("Could not found room.");
            return;
        }
        res.status(200).json(findedRoom);
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to get room", { method: `${req.method} ${req.url}`, err, body: req === null || req === void 0 ? void 0 : req.body });
    }
}));
router.post("/update-room", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId, roles, projectName } = req.body;
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (!findedRoom) {
            res.status(404).json("Could not find the room.");
            return;
        }
        if (roles) {
            const r = JSON.parse(roles);
            if (r.deleteField) {
                findedRoom.$set(`roles.${r.uid}`, undefined);
            }
            else {
                findedRoom.$set(`roles.${r.uid}`, r);
            }
        }
        if (projectName) {
            findedRoom.$set(`projectName`, projectName);
        }
        yield findedRoom.save();
        res.status(200).json("Successfully updated room.");
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to update room", { method: `${req.method} ${req.url}`, err, body: req === null || req === void 0 ? void 0 : req.body });
    }
}));
router.get("/check-room-access", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { roomId, uid } = req.query;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        if (!uid) {
            res.status(404).json("Please provide user uid.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (!findedRoom) {
            res.status(404).json("Room no longer exists..");
            return;
        }
        const currentRequestUsers = JSON.parse(JSON.stringify(findedRoom.requestedUsers));
        const isUserRequested = currentRequestUsers && ((_a = currentRequestUsers[`${uid}`]) === null || _a === void 0 ? void 0 : _a.uid) === uid;
        const currentRoles = JSON.parse(JSON.stringify(findedRoom.roles));
        const isUserExist = currentRoles && ((_b = currentRoles[`${uid}`]) === null || _b === void 0 ? void 0 : _b.uid) === uid;
        if (!isUserRequested && !isUserExist) {
            res.status(200).json({ roomId, rejected: true });
            return;
        }
        if (isUserExist) {
            res.status(200).json({ roomId, hasRoomAccess: true });
            return;
        }
        res.status(200).json({ roomId, hasRoomAccess: false });
    }
    catch (err) {
        res.status(404).json(err);
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Room access", { method: `${req.method} ${req.url}`, err, body: req === null || req === void 0 ? void 0 : req.body });
    }
}));
router.patch("/update-room-user", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId, users } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        if (!users) {
            res.status(404).json("User is empty");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (!findedRoom) {
            res.status(404).json("Room no longer exists..");
            return;
        }
        for (const user of users) {
            if (!(user === null || user === void 0 ? void 0 : user.ownerAction)) {
                return;
            }
            if (user.ownerAction === "accept") {
                const name = (user === null || user === void 0 ? void 0 : user.name) || user.email.split("@")[0];
                const payload = { uid: user.uid, name, role: user.role, email: user.email };
                findedRoom.$set(`roles.${user.uid}`, payload);
                findedRoom.$set(`requestedUsers.${user.uid}`, undefined);
            }
            if (user.ownerAction === "reject") {
                findedRoom.$set(`requestedUsers.${user.uid}`, undefined);
            }
            yield findedRoom.save();
        }
        res.status(200).json("Updated room user successfully");
        return;
    }
    catch (err) {
        console.error("Error updating room user:", err);
        (0, logger_1.logWithData)(logLevels_1.default.Error, "update Room user", { method: `${req.method} ${req.url}`, err, body: req === null || req === void 0 ? void 0 : req.body });
        res.status(500).json("Internal Server Error");
        return;
    }
}));
router.post("/join-room", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const { roomId, user } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        if (!user) {
            res.status(404).json("Please provide user info.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (!findedRoom) {
            res.status(404).json("Room no longer exists..");
            return;
        }
        const currentRoles = JSON.parse(JSON.stringify(findedRoom.roles));
        const isUserExist = currentRoles && ((_c = currentRoles[user.uid]) === null || _c === void 0 ? void 0 : _c.uid) === user.uid;
        if (isUserExist) {
            res.status(200).json({ roomId, hasRoomAccess: true });
            return;
        }
        const requestUserPayload = { uid: user.uid, email: user.email, name: user.displayName };
        findedRoom.$set(`requestedUsers.${user.uid}`, requestUserPayload);
        yield findedRoom.save();
        res.status(200).json({ roomId, hasRoomAccess: false });
    }
    catch (err) {
        res.status(404).json(err);
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to join room", { method: `${req.method} ${req.url}`, err, body: req === null || req === void 0 ? void 0 : req.body });
    }
}));
// eslint-disable-next-line consistent-return
router.get("/export", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId } = req.query;
        const data = yield Room_1.default.findOne({ roomId }).lean().exec();
        if (!data) {
            return res.status(404).json({ error: "No data found" });
        }
        const jsonData = JSON.stringify(data);
        res.send(jsonData);
    }
    catch (error) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "export deck", { method: `${req.method} ${req.url}`, error, body: req === null || req === void 0 ? void 0 : req.query });
        res.status(500).json({ error: "Internal server error" });
    }
}));
router.patch("/import", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const { roomId, roomData, isOverride } = req.body;
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (!findedRoom) {
            res.status(404).json("Room no longer exists..");
            return;
        }
        const parsedRoom = JSON.parse(JSON.stringify(findedRoom));
        const parsedRoomData = JSON.parse(roomData);
        if (!isOverride) {
            const difference = (0, json_diff_1.diff)(parsedRoom, parsedRoomData);
            if (difference) {
                difference === null || difference === void 0 ? true : delete difference.updatedAt;
            }
            if (difference && ((_d = Object.values(difference)) === null || _d === void 0 ? void 0 : _d.length) > 0) {
                res.status(200).json({ hasDifference: true });
                return;
            }
        }
        findedRoom.$set(`nodes`, parsedRoomData.nodes);
        findedRoom.$set(`publicNotes`, parsedRoomData.publicNotes);
        yield findedRoom.save();
        res.status(200).json(findedRoom);
    }
    catch (error) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Import deck", { method: `${req.method} ${req.url}`, error, body: req === null || req === void 0 ? void 0 : req.body });
    }
}));
router.post("/delete-room", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        const findedRoom = yield Room_1.default.findOneAndDelete({ roomId });
        let message = "Deleted Successfully!";
        if (!findedRoom) {
            message = "room no longer exists!";
        }
        res.status(200).json(message);
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Room access", { method: `${req.method} ${req.url}`, err, body: req === null || req === void 0 ? void 0 : req.body });
    }
}));
router.post("/get-all-rooms", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { uid } = req.body;
        if (!uid) {
            res.status(404).json("uid undefined.");
            return;
        }
        const allRooms = yield Room_1.default.find({ [`roles.${uid}.uid`]: uid });
        res.status(200).json(allRooms);
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to fetch all rooms", {
            method: `${req.method} ${req.url}`,
            err,
            body: req === null || req === void 0 ? void 0 : req.body,
        });
    }
}));
exports.default = router;
//# sourceMappingURL=Rooms.js.map