"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const room = new mongoose_1.Schema({
    projectName: {
        type: String,
        required: true,
    },
    roomId: {
        type: String,
        required: true,
    },
    nodes: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed,
    },
    roles: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    lastSavedIcon: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed,
    },
    publicNotes: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed,
    },
    requestedUsers: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed,
    },
}, { minimize: false, timestamps: true });
exports.default = (0, mongoose_1.model)("rooms", room);
//# sourceMappingURL=Room.js.map