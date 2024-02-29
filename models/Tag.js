"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tag = new mongoose_1.Schema({
    keyword: {
        type: String,
        required: true,
    },
    imageUrls: {
        type: [String],
        required: true,
    },
    tag: {
        type: String,
        required: true,
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("tags", tag);
//# sourceMappingURL=Tag.js.map