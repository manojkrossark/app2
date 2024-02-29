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
const Room_1 = __importDefault(require("../models/Room"));
const logger_1 = require("../common/logger");
const logLevels_1 = __importDefault(require("../constants/logLevels"));
const router = (0, express_1.Router)();
router.post("/create-room", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId, projectName, roles, nodes, publicNotes, requestedUsers } = req.body;
        if (!roomId || !projectName || !roles) {
            res.status(404).json("Please provide roomId or project name or roles.");
            return;
        }
        const room = new Room_1.default({ roomId, projectName, nodes, publicNotes, requestedUsers });
        room.$set(`roles.${roles.uid}`, roles);
        yield room.save();
        res.status(200).json({ message: "Successfully created room" });
        (0, logger_1.logWithData)(logLevels_1.default.Info, "Room created", { method: `${req.method} ${req.url}`, body: req.body });
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to create room", { method: `${req.method} ${req.url}`, err, body: req === null || req === void 0 ? void 0 : req.body });
    }
}));
router.post("/get-room", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        (0, logger_1.logWithData)(logLevels_1.default.Info, "Fetched room", { method: `${req.method} ${req.url}`, body: req.body });
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to get room", { method: `${req.method} ${req.url}`, err, body: req === null || req === void 0 ? void 0 : req.body });
    }
}));
router.post("/update-room", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Updated room", { method: `${req.method} ${req.url}`, body: req === null || req === void 0 ? void 0 : req.body });
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to update room", { method: `${req.method} ${req.url}`, err, body: req === null || req === void 0 ? void 0 : req.body });
    }
}));
router.get("/check-room-access", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.patch("/update-room-user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        users.forEach((user) => __awaiter(void 0, void 0, void 0, function* () {
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
        }));
        res.status(200).json("Updated room user successfully");
    }
    catch (err) {
        res.status(404).json(err);
        (0, logger_1.logWithData)(logLevels_1.default.Error, "update Room user", { method: `${req.method} ${req.url}`, err, body: req === null || req === void 0 ? void 0 : req.body });
    }
}));
router.post("/join-room", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.get("/export", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.patch("/import", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId, roomData } = req.body;
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (!findedRoom) {
            res.status(404).json("Room no longer exists..");
            return;
        }
        const parsedRoomData = JSON.parse(roomData);
        findedRoom.$set(`nodes`, parsedRoomData.nodes);
        findedRoom.$set(`publicNotes`, parsedRoomData.publicNotes);
        yield findedRoom.save();
        res.status(200).json(findedRoom);
    }
    catch (error) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Import deck", { method: `${req.method} ${req.url}`, error, body: req === null || req === void 0 ? void 0 : req.query });
    }
}));
router.post("/delete-room", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.post("/get-all-rooms", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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