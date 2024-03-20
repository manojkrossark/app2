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
/* eslint-disable radix */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const express_1 = require("express");
const oauth_1 = __importDefault(require("oauth"));
const constants_1 = require("../constants");
const fetchIcons_1 = require("../utils/fetchIcons");
const Icon_1 = __importDefault(require("../models/Icon"));
const logger_1 = require("../common/logger");
const logLevels_1 = __importDefault(require("../constants/logLevels"));
const Room_1 = __importDefault(require("../models/Room"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
const removeDuplicates = (arr, idProperty) => {
    const seenIds = new Set();
    return arr.filter((obj) => {
        const id = obj[idProperty];
        if (!seenIds.has(id)) {
            seenIds.add(id);
            return true;
        }
        return false;
    });
};
router.get("/fetch-icons", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const searchKeyword = req.query.keyword;
        const page = req.query.page;
        const { roomId } = req.query;
        if (!roomId) {
            res.status(404).json("Room Id is required");
        }
        if (!searchKeyword) {
            res.status(404).json("Please search icon to fetch result");
        }
        const foundRoom = yield Room_1.default.findOne({ roomId });
        if (!foundRoom) {
            res.status(404).json("Room no longer exists..");
            return;
        }
        const iconAlreadyPresent = yield Icon_1.default.findOne({ keyword: searchKeyword });
        const totalIconListLength = iconAlreadyPresent === null || iconAlreadyPresent === void 0 ? void 0 : iconAlreadyPresent.iconList.length;
        const nextPage = (iconAlreadyPresent === null || iconAlreadyPresent === void 0 ? void 0 : iconAlreadyPresent.nounNextPageToken) || "";
        const requiredTotal = parseInt(page) * 50;
        const isExistingIcons = totalIconListLength >= requiredTotal;
        if (!iconAlreadyPresent || (iconAlreadyPresent && !isExistingIcons)) {
            // To Fetch From Api call
            const oauth = new oauth_1.default.OAuth(constants_1.NOUN_URL, constants_1.NOUN_URL, constants_1.KEY, constants_1.SECRET, "1.0", null, "HMAC-SHA1");
            oauth.get(`${constants_1.NOUN_API_URL}${searchKeyword}&limit=50&next_page=${nextPage}`, "", "", (err, result) => __awaiter(void 0, void 0, void 0, function* () {
                var _b, _c, _d, _e;
                if (err) {
                    (0, logger_1.logWithData)(logLevels_1.default.Error, "Failed to fetch icon from Noun project", {
                        method: `${req.method} ${req.url}`,
                        err,
                    });
                    res.status(404).send({ message: err });
                    return;
                }
                if (result) {
                    const nounIcons = JSON.parse(result.toString());
                    if ((nounIcons === null || nounIcons === void 0 ? void 0 : nounIcons.total) === 0 || ((_b = nounIcons === null || nounIcons === void 0 ? void 0 : nounIcons.icons) === null || _b === void 0 ? void 0 : _b.length) === 0 || (nounIcons === null || nounIcons === void 0 ? void 0 : nounIcons.total) === totalIconListLength) {
                        res.status(404).send({ message: "No Icon found" });
                        return;
                    }
                    if (nounIcons.total < requiredTotal) {
                        res.status(404).send({ message: "No more icon found" });
                        return;
                    }
                    if (iconAlreadyPresent) {
                        // Update existing Icon document
                        const existingIcon = iconAlreadyPresent;
                        const ParsedIcons = JSON.parse(JSON.stringify(iconAlreadyPresent));
                        if (ParsedIcons) {
                            const promises = (_c = nounIcons.icons) === null || _c === void 0 ? void 0 : _c.map((icon) => __awaiter(void 0, void 0, void 0, function* () {
                                const base64Data = yield (0, fetchIcons_1.fetchData)(icon.thumbnail_url);
                                return {
                                    id: icon.id,
                                    keyword: searchKeyword.toLowerCase(),
                                    thumbnail_url: base64Data,
                                };
                            }));
                            const results = yield Promise.all(promises);
                            const updatedList = ParsedIcons.iconList.concat(results);
                            // for (const icon of nounIcons.icons) {
                            //   const base64Data = await fetchData(icon.thumbnail_url);
                            //   if (base64Data) {
                            //     ParsedIcons.iconList.push({
                            //       id: icon.id,
                            //       thumbnail_url: base64Data,
                            //     });
                            //   }
                            // }
                            existingIcon.iconList = updatedList;
                            existingIcon.nounNextPageToken = nounIcons.next_page;
                            yield existingIcon.save();
                            const ParsedRoom = JSON.parse(JSON.stringify(foundRoom));
                            const lastSavedIcon = Object.values((_d = ParsedRoom.lastSavedIcon) !== null && _d !== void 0 ? _d : []);
                            const foundIcon = lastSavedIcon.find((item) => item.keyword.toLowerCase() === searchKeyword.toLowerCase());
                            if (lastSavedIcon.length > 0 && foundIcon) {
                                const foundIndex = updatedList.findIndex((icon) => icon.id === foundIcon.iconId);
                                const swappedIcon = updatedList[0];
                                updatedList[0] = { id: foundIcon.iconId, thumbnail_url: foundIcon.url };
                                updatedList[foundIndex] = swappedIcon;
                            }
                            const uniqueArray = removeDuplicates(updatedList, "thumbnail_url");
                            const extendedIconList = {};
                            extendedIconList.icons = uniqueArray.slice(0, requiredTotal);
                            res.send(extendedIconList);
                        }
                    }
                    else {
                        // New Icon Download and Upload in DB
                        const newIcon = new Icon_1.default({ keyword: searchKeyword });
                        const promises = (_e = nounIcons.icons) === null || _e === void 0 ? void 0 : _e.map((icon) => __awaiter(void 0, void 0, void 0, function* () {
                            const base64Data = yield (0, fetchIcons_1.fetchData)(icon.thumbnail_url);
                            return {
                                id: icon.id,
                                keyword: searchKeyword.toLowerCase(),
                                thumbnail_url: base64Data,
                            };
                        }));
                        const results = yield Promise.all(promises);
                        newIcon.iconList = results;
                        newIcon.nounNextPageToken = nounIcons.next_page;
                        // for (const icon of nounIcons.icons) {
                        //   const base64Data = await fetchData(icon.thumbnail_url);
                        //   if (base64Data) {
                        //     newIcon.iconList.push({
                        //       id: icon.id,
                        //       thumbnail_url: base64Data,
                        //     });
                        //     newIcon.nounNextPageToken = nounIcons.next_page;
                        //   }
                        // }
                        yield newIcon.save();
                        const newIconList = {};
                        const newIconValue = JSON.parse(JSON.stringify(newIcon));
                        const uniqueArray = removeDuplicates(newIconValue.iconList, "thumbnail_url");
                        newIconList.icons = uniqueArray.slice(0, requiredTotal);
                        res.send(newIconList);
                    }
                }
            }));
        }
        else {
            // To Fetch From DB
            console.log("fetched with db");
            const iconList = {};
            const ParsedIcons = JSON.parse(JSON.stringify(iconAlreadyPresent));
            const ParsedRoom = JSON.parse(JSON.stringify(foundRoom));
            const lastSavedIcon = Object.values((_a = ParsedRoom.lastSavedIcon) !== null && _a !== void 0 ? _a : []);
            const foundIcon = lastSavedIcon.find((item) => item.keyword.toLowerCase() === searchKeyword.toLowerCase());
            const updateIconList = [...ParsedIcons.iconList];
            if (lastSavedIcon.length > 0 && foundIcon) {
                const foundIndex = updateIconList.findIndex((icon) => icon.id === foundIcon.iconId);
                const swappedIcon = updateIconList[0];
                updateIconList[0] = { id: foundIcon.iconId, thumbnail_url: foundIcon.url };
                updateIconList[foundIndex] = swappedIcon;
            }
            const uniqueArray = removeDuplicates(updateIconList, "thumbnail_url");
            iconList.icons = uniqueArray.slice(0, requiredTotal);
            res.send(iconList);
        }
    }
    catch (err) {
        (0, logger_1.logWithData)(logLevels_1.default.Error, "get Icon failed", { method: `${req.method} ${req.url}`, err });
    }
}));
exports.default = router;
//# sourceMappingURL=Icons.js.map