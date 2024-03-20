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
const sendEmail_1 = __importDefault(require("../common/sendEmail"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post("/save-updated-node", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { roomId, nodes, pageName } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (findedRoom) {
            const payload = (_a = JSON.parse(nodes)) !== null && _a !== void 0 ? _a : {};
            const nodeKeys = Object.keys(payload);
            if (nodeKeys.length > 1) {
                const previousNodes = JSON.parse(JSON.stringify(findedRoom.nodes));
                nodeKeys.forEach((id) => {
                    previousNodes[pageName].nodes[id] = payload[id];
                    findedRoom.$set("nodes", previousNodes);
                });
                yield findedRoom.save();
                res.status(200).json({ message: "Updated nodes Successfully!", nodes: findedRoom.nodes });
                return;
            }
            const nodeId = nodeKeys[0];
            const updateObject = {};
            updateObject[`nodes.${pageName}.nodes.${nodeId}`] = payload[nodeId];
            yield Room_1.default.updateOne({ roomId }, { $set: updateObject });
            const actualNode = yield Room_1.default.findOne({ roomId });
            res.status(200).json({ message: "Updated node Successfully!", nodes: actualNode === null || actualNode === void 0 ? void 0 : actualNode.nodes });
        }
        else {
            res.status(404).json("Could not found room.");
        }
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to update node", { method: `${req.method} ${req.url}`, err, body: req === null || req === void 0 ? void 0 : req.body });
    }
}));
router.post("/save-updated-publicNotes-node", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { roomId, nodes } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (findedRoom) {
            const payload = (_b = JSON.parse(nodes)) !== null && _b !== void 0 ? _b : {};
            const nodeKeys = Object.keys(payload);
            const nodeId = nodeKeys[0];
            const updateObject = {};
            updateObject[`publicNotes.${nodeId}`] = payload[nodeId];
            yield Room_1.default.updateOne({ roomId }, { $set: updateObject });
            res.status(200).json("Updated Successfully!");
        }
        else {
            res.status(404).json("Could not found room.");
        }
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to update public notes", {
            method: `${req.method} ${req.url}`,
            err,
            body: req === null || req === void 0 ? void 0 : req.body,
        });
    }
}));
router.patch("/add-group-nodes", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const { roomId, selectedNodeIds, pageName } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (findedRoom) {
            const payload = (_c = JSON.parse(selectedNodeIds)) !== null && _c !== void 0 ? _c : {};
            const currentNodes = JSON.parse(JSON.stringify(findedRoom.nodes));
            const groupLength = Object.values(currentNodes[pageName].groupNodes).length;
            currentNodes[pageName].groupNodes[`group${groupLength}`] = payload;
            findedRoom.$set("nodes", currentNodes);
            yield findedRoom.save();
            res.status(200).json("Updated Successfully!");
        }
        else {
            res.status(404).json("Could not found room.");
        }
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to add group nodes", {
            method: `${req.method} ${req.url}`,
            err,
            body: req === null || req === void 0 ? void 0 : req.body,
        });
    }
}));
router.get("/get-group-nodes", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId, pageName } = req.query;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (findedRoom) {
            const currentNodes = JSON.parse(JSON.stringify(findedRoom.nodes));
            const { groupNodes } = currentNodes[`${pageName}`];
            res.status(200).json(groupNodes);
        }
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to get group nodes", {
            method: `${req.method} ${req.url}`,
            err,
            body: req === null || req === void 0 ? void 0 : req.body,
        });
    }
}));
router.post("/add-new-page", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId, nodes } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId }).lean();
        if (findedRoom) {
            const payload = JSON.parse(nodes) || {};
            const updatedNodes = Object.assign(Object.assign({}, findedRoom.nodes), payload);
            yield Room_1.default.updateOne({ roomId }, { $set: { nodes: updatedNodes } });
            res.status(200).json("Updated Successfully!");
        }
        else {
            res.status(404).json("Could not found room.");
        }
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to add new page", {
            method: `${req.method} ${req.url}`,
            err,
            body: req === null || req === void 0 ? void 0 : req.body,
        });
    }
}));
router.post("/save-deleted-node", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
    try {
        const { roomId, nodesToUpdate, nodesToDelete, pageName } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (findedRoom) {
            const deletePayload = (_d = JSON.parse(nodesToDelete)) !== null && _d !== void 0 ? _d : [];
            const updatePayload = (_e = JSON.parse(nodesToUpdate)) !== null && _e !== void 0 ? _e : [];
            const currentNodes = JSON.parse(JSON.stringify(findedRoom.nodes));
            const deleteNodeIds = Object.keys(deletePayload);
            const updateNodeIds = Object.keys(updatePayload);
            updateNodeIds.forEach((id) => {
                currentNodes[pageName].nodes[id] = updatePayload[id];
                findedRoom.$set(`nodes`, currentNodes);
            });
            deleteNodeIds.forEach((id) => {
                delete currentNodes[pageName].nodes[id];
                findedRoom.$set("nodes", currentNodes);
            });
            yield findedRoom.save();
            res.status(200).json({ message: "Deleted Successfully!", nodes: findedRoom === null || findedRoom === void 0 ? void 0 : findedRoom.nodes });
        }
        else {
            res.status(404).json("Could not found room.");
        }
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to save deleted nodes", {
            method: `${req.method} ${req.url}`,
            err,
            body: req === null || req === void 0 ? void 0 : req.body,
        });
    }
}));
router.post("/publicNotes-deleted-node", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g;
    try {
        const { roomId, nodesToUpdate, nodesToDelete } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (findedRoom) {
            const deletePayload = (_f = JSON.parse(nodesToDelete)) !== null && _f !== void 0 ? _f : [];
            const updatePayload = (_g = JSON.parse(nodesToUpdate)) !== null && _g !== void 0 ? _g : [];
            const currentNodes = JSON.parse(JSON.stringify(findedRoom.publicNotes));
            const deleteNodeIds = Object.keys(deletePayload);
            const updateNodeIds = Object.keys(updatePayload);
            updateNodeIds.forEach((id) => {
                currentNodes.publicNotes[id] = updatePayload[id];
                findedRoom.$set(`publicNotes`, currentNodes);
            });
            deleteNodeIds.forEach((id) => {
                delete currentNodes[id];
                findedRoom.$set("publicNotes", currentNodes);
            });
            yield findedRoom.save();
            res.status(200).json("Deleted Successfully!");
        }
        else {
            res.status(404).json("Could not found room.");
        }
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to delete public nodes", {
            method: `${req.method} ${req.url}`,
            err,
            body: req === null || req === void 0 ? void 0 : req.body,
        });
    }
}));
router.post("/save-updated-icon", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    try {
        const { roomId, iconListToUpdate } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (findedRoom) {
            const payload = (_h = JSON.parse(iconListToUpdate)) !== null && _h !== void 0 ? _h : [];
            const nodeIds = Object.keys(payload);
            nodeIds.forEach((id) => {
                const node = payload[id];
                findedRoom.$set(`lastSavedIcon.${id}`, node);
            });
            yield findedRoom.save();
            res.status(200).json("Updated Successfully!");
        }
        else {
            res.status(404).json("Could not found room.");
        }
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to save updated icon", {
            method: `${req.method} ${req.url}`,
            err,
            body: req === null || req === void 0 ? void 0 : req.body,
        });
    }
}));
router.post("/delete-deck-page", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId, pageName } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        if (!pageName) {
            res.status(404).json("please provide useCase name");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (findedRoom) {
            const currentNodes = JSON.parse(JSON.stringify(findedRoom.nodes));
            delete currentNodes[pageName];
            yield Room_1.default.updateOne({ roomId }, { $set: { nodes: currentNodes } });
            res.json(currentNodes);
        }
        else {
            res.status(404).json("Room not found");
        }
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to delete deck pages", {
            method: `${req.method} ${req.url}`,
            err,
            body: req === null || req === void 0 ? void 0 : req.body,
        });
    }
}));
router.post("/undo-redo-delete", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId, nextHistory, pageName } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (findedRoom) {
            let historyDiff = nextHistory ? JSON.parse(nextHistory) : [];
            if (historyDiff.length === 0) {
                res.status(404).json("NodeHistory is Empty!");
                return;
            }
            const currentNodes = JSON.parse(JSON.stringify(findedRoom.nodes));
            historyDiff = historyDiff.diff;
            if (historyDiff.length > 1) {
                historyDiff.forEach((nodeId) => {
                    delete currentNodes[pageName].nodes[nodeId];
                    findedRoom.$set(`nodes`, currentNodes);
                });
                yield findedRoom.save();
                res.status(200).json("Updated nodes Successfully!");
                return;
            }
            delete currentNodes[pageName].nodes[historyDiff];
            yield Room_1.default.updateOne({ roomId }, { $set: { nodes: currentNodes } });
            res.status(200).json("Updated node Successfully!");
        }
        else {
            res.status(404).json("Could not found room.");
        }
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to undo redo delete", {
            method: `${req.method} ${req.url}`,
            err,
            body: req === null || req === void 0 ? void 0 : req.body,
        });
    }
}));
router.post("/send-email", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { to, subject, text, from, cc } = req.body;
    if (!to || !subject || !text || !from) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }
    const msg = {
        to,
        from,
        subject,
        text,
        cc,
    };
    try {
        yield (0, sendEmail_1.default)(msg, true);
        res.status(200).json({ success: true, message: "Email sent successfully" });
    }
    catch (error) {
        console.error("Error sending email", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
router.post("/get-users-email", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (findedRoom) {
            const roles = JSON.parse(JSON.stringify(findedRoom.roles));
            const emails = [];
            const rolesKeys = Object.keys(roles);
            rolesKeys.forEach((userId) => {
                const user = roles[userId];
                if (user.email && user.role !== "owner") {
                    emails.push(user.email);
                }
            });
            res.json({ emails });
        }
    }
    catch (error) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to get user email", {
            method: `${req.method} ${req.url}`,
            error,
            body: req === null || req === void 0 ? void 0 : req.body,
        });
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.post("/rename-deck", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId, updatedName, pageName } = req.body;
        if (!roomId) {
            res.status(404).json("Please provide room id.");
            return;
        }
        const findedRoom = yield Room_1.default.findOne({ roomId });
        if (findedRoom) {
            const currentNodes = JSON.parse(JSON.stringify(findedRoom.nodes));
            if (!currentNodes[pageName]) {
                res.send(404).json("Could not found useCase.");
                return;
            }
            currentNodes[pageName].deckName = updatedName;
            findedRoom.nodes = currentNodes;
            yield findedRoom.save();
            res.status(200).json("Deck Renamed Successfully!");
        }
        else {
            res.status(404).json("Could not found room.");
        }
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to Rename deck", {
            method: `${req.method} ${req.url}`,
            err,
            body: req === null || req === void 0 ? void 0 : req.body,
        });
    }
}));
exports.default = router;
//# sourceMappingURL=Nodes.js.map