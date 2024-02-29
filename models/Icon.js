"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const icon = new mongoose_1.Schema({
    keyword: {
        type: String,
        required: true,
    },
    iconList: {
        type: [Map],
        of: mongoose_1.Schema.Types.Mixed,
    },
    nounNextPageToken: {
        type: String,
    }
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("icons", icon);
//# sourceMappingURL=Icon.js.map