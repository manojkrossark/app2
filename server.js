"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const roomController_1 = __importDefault(require("./controllers/roomController"));
const Rooms_1 = __importDefault(require("./routes/Rooms"));
const Nodes_1 = __importDefault(require("./routes/Nodes"));
const Tags_1 = __importDefault(require("./routes/Tags"));
const Icons_1 = __importDefault(require("./routes/Icons"));
const Users_1 = __importDefault(require("./routes/Users"));
const db_connect_1 = require("./db_connect");
const constants_1 = require("./constants");
if (process.env.NODE_ENV !== "production") {
    dotenv_1.default.config();
}
console.log("Environment", process.env.NODE_ENV);
const PORT = process.env.PORT || 8080;
const app = (0, express_1.default)();
// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require("body-parser");
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        "http://slatedev3.s3-website.eu-north-1.amazonaws.com, https://d1ukh8oullowub.cloudfront.net",
    ],
    methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    credentials: true,
}));
app.use(bodyParser.json({ limit: constants_1.PAYLOAD_SIZE }));
app.use(bodyParser.urlencoded({ limit: constants_1.PAYLOAD_SIZE, extended: true, parameterLimit: 5000000 }));
app.use(express_1.default.json());
app.get("/", (_, res) => {
    res.send("SLATE BACKEND SERVER IS RUNNING!");
});
// send Email
// Set your SendGrid API key
mail_1.default.setApiKey(constants_1.SEND_GRID_KEY);
app.use(express_1.default.json());
app.use("/api/room", Rooms_1.default);
app.use("/api/node", Nodes_1.default);
app.use("/api/tag", Tags_1.default);
app.use("/api/user", Users_1.default);
app.use("/api/icon", Icons_1.default);
const server = http_1.default.createServer(app);
const roomUsers = new Map(); // currently online users for each room
const io = new socket_io_1.Server(server, {
    pingInterval: 24 * 60 * 60 * 1000,
    pingTimeout: 3 * 24 * 60 * 60 * 1000,
    transports: ["websocket", "polling"],
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
io.on("connection", (socket) => {
    console.log("a client has connected");
    socket.emit("connection-success");
    (0, roomController_1.default)(socket, roomUsers);
    socket.on("disconnect", () => {
        console.log("a client has disconnected");
    });
});
(0, db_connect_1.dbConnect)(); // Connecting to MongoDB database
server.listen(PORT, () => {
    console.log(`server is running on ${PORT}...`);
});
//# sourceMappingURL=server.js.map