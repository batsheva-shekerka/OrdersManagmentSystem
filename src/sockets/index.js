const { Server } = require("socket.io");
const env = require("../config/env");

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: env.clientOrigin },
  });

  io.on("connection", (socket) => {
    socket.on("admin:join", () => socket.join("admin"));
    socket.on("order:join", (orderId) => socket.join(`order:${orderId}`));
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocket(server) first.");
  }
  return io;
}

function toPlain(order) {
  return order && typeof order.toObject === "function"
    ? order.toObject()
    : order;
}

function emitOrderNew(order) {
  if (io) io.to("admin").emit("order:new", toPlain(order));
}

function emitOrderStatusChanged(order) {
  if (!io) return;
  const payload = toPlain(order);
  io.to("admin").emit("order:statusChanged", payload);
  io.to(`order:${payload._id}`).emit("order:statusChanged", payload);
}

module.exports = { initSocket, getIO, emitOrderNew, emitOrderStatusChanged };
