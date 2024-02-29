"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userColors = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899"];
const roomController = (socket, roomUsers) => {
    const joinRoom = ({ roomId, user }) => {
        const currUsers = roomUsers.get(roomId);
        let color;
        if (!currUsers) {
            // eslint-disable-next-line prefer-destructuring
            color = userColors[0];
            roomUsers.set(roomId, {
                colorIdx: 1,
                users: [{ socketId: socket.id, user: Object.assign(Object.assign({}, user), { color }) }],
            });
        }
        else {
            socket.emit("get-room-users", currUsers.users);
            color = userColors[currUsers.colorIdx];
            roomUsers.set(roomId, {
                colorIdx: (currUsers.colorIdx + 1) % userColors.length,
                users: [...currUsers.users, { socketId: socket.id, user: Object.assign(Object.assign({}, user), { color }) }],
            });
        }
        socket.join(roomId);
        console.log(`a client has joined room ${roomId}`);
        socket.broadcast.to(roomId).emit("user-joined", { socketId: socket.id, user: Object.assign(Object.assign({}, user), { color }) });
    };
    const leaveRoom = ({ roomId }) => {
        var _a;
        if (socket.rooms.has(roomId)) {
            socket.leave(roomId);
            console.log(`a client has left a room ${roomId}`);
            const currUsers = roomUsers.get(roomId);
            if (currUsers) {
                roomUsers.set(roomId, Object.assign(Object.assign({}, currUsers), { users: currUsers.users.filter((user) => user.socketId !== socket.id) }));
            }
            if (((_a = roomUsers.get(roomId)) === null || _a === void 0 ? void 0 : _a.users.length) === 0) {
                roomUsers.delete(roomId);
            }
            socket.broadcast.to(roomId).emit("user-left", { socketId: socket.id });
        }
    };
    const updateRoom = (payload) => {
        const { roomId } = payload;
        if (socket.rooms.has(roomId)) {
            socket.broadcast.to(roomId).emit("get-room-update", payload);
        }
    };
    const updateUserMouse = ({ roomId, userCursor }) => {
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
    socket.on("update-user-mouse", updateUserMouse);
    socket.on("delete-room-nodes", deleteRoomNodes);
    socket.on("disconnecting", () => {
        socket.rooms.forEach((roomId) => {
            if (roomId !== socket.id) {
                leaveRoom({ roomId });
            }
        });
    });
};
exports.default = roomController;
//# sourceMappingURL=roomController.js.map