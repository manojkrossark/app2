"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const user = new mongoose_1.Schema({
    uid: {
        type: String,
        required: true,
    },
    fullName: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: true,
        index: { unique: true },
    },
    password: {
        type: String,
        required: false,
    },
    photoUrl: {
        type: String,
        required: false,
    },
    isActive: {
        type: Boolean,
        required: true,
    },
    isPasswordSet: {
        type: Boolean,
        required: true,
    },
    isGoogleSignIn: {
        type: Boolean,
        required: true,
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("users", user);
//# sourceMappingURL=User.js.map