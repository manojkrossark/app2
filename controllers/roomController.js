"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userColors = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899"];
const roomController = (socket, roomUsers) => {
    const joinRoom = ({ roomId, isGlobal, user, }) => {
        const currUsers = roomUsers.get(roomId);
        let color;
        if (!currUsers) {
            // eslint-disable-next-line prefer-destructuring
            color = userColors[0];
            roomUsers.set(roomId, {
                colorIdx: 1,
                isGlobal,
                users: [{ socketId: socket.id, user: Object.assign(Object.assign({}, user), { color }) }],
            });
        }
        else {
            socket.emit("get-room-users", currUsers.users);
            color = userColors[currUsers.colorIdx];
            roomUsers.set(roomId, {
                colorIdx: (currUsers.colorIdx + 1) % userColors.length,
                isGlobal,
                users: [...currUsers.users, { socketId: socket.id, user: Object.assign(Object.assign({}, user), { color }) }],
            });
        }
        socket.join(roomId);
        console.log(`a client has joined room ${roomId}`);
        socket.broadcast.to(roomId).emit("user-joined", { socketId: socket.id, user: Object.assign(Object.assign({}, user), { color }) });
    };
    const leaveRoom = ({ roomId, isGlobal, userUid }) => {
        var _a;
        if (socket.rooms.has(roomId)) {
            const currUsers = roomUsers.get(roomId);
            if (!isGlobal && (currUsers === null || currUsers === void 0 ? void 0 : currUsers.isGlobal))
                return;
            socket.leave(roomId);
            if (currUsers) {
                roomUsers.set(roomId, Object.assign(Object.assign({}, currUsers), { users: currUsers.users.filter((user) => user.socketId !== socket.id) }));
            }
            if (((_a = roomUsers.get(roomId)) === null || _a === void 0 ? void 0 : _a.users.length) === 0) {
                roomUsers.delete(roomId);
            }
            if (isGlobal && userUid) {
                roomUsers.forEach((value, id) => {
                    var _a;
                    const roomValue = value;
                    const filteredUsers = (_a = roomValue === null || roomValue === void 0 ? void 0 : roomValue.users) === null || _a === void 0 ? void 0 : _a.filter((user) => { var _a; return ((_a = user === null || user === void 0 ? void 0 : user.user) === null || _a === void 0 ? void 0 : _a.uid) !== userUid; });
                    roomValue.users = filteredUsers;
                    roomUsers.set(id, value);
                });
            }
            console.log(`a client has left a room ${roomId}`);
            if (currUsers === null || currUsers === void 0 ? void 0 : currUsers.isGlobal) {
                socket.broadcast.to(roomId).emit("user-left", { socketId: socket.id });
            }
        }
    };
    const removeUserRoom = ({ roomId, removeUserUid }) => {
        if (socket.rooms.has(roomId)) {
            const currUsers = roomUsers.get(roomId);
            if (currUsers) {
                const uniqueUsers = currUsers === null || currUsers === void 0 ? void 0 : currUsers.users.filter((user, index, self) => index === self.findIndex((u) => u.user.uid === user.user.uid));
                const updatedUsers = uniqueUsers.filter((user) => user.user.uid !== removeUserUid);
                currUsers.users = updatedUsers;
                roomUsers.set(roomId, currUsers);
            }
            socket.broadcast.to(roomId).emit("remove-user", { removeUserUid });
        }
    };
    const updateRoom = (payload) => {
        const { roomId } = payload;
        if (socket.rooms.has(roomId)) {
            socket.broadcast.to(roomId).emit("get-room-update", payload);
        }
    };
    const updateUserMouse = ({ roomId, userCursor, }) => {
        socket.broadcast.to(roomId).emit("get-user-mouse-update", { socketId: socket.id, userCursor });
    };
    const deleteRoomNodes = (payload) => {
        const { roomId } = payload;
        if (socket.rooms.has(roomId)) {
            socket.broadcast.to(roomId).emit("get-room-delete-nodes", payload);
        }
    };
    socket.on("join-room", joinRoom);
    socket.on("leave-room", leaveRoom);
    socket.on("update-room", updateRoom);
    socket.on("remove-user", removeUserRoom);
    socket.on("update-user-mouse", updateUserMouse);
    socket.on("delete-room-nodes", deleteRoomNodes);
    socket.on("disconnecting", () => {
        socket.rooms.forEach((roomId) => {
            if (roomId !== socket.id) {
                leaveRoom({ roomId, isGlobal: false });
            }
        });
    });
};
exports.default = roomController;
//# sourceMappingURL=roomController.js.map