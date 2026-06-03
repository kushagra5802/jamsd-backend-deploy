// socketHandler.js
const { Server } = require("socket.io");
const Conversation = require("../modules/directory/chat/conversation.model");
const Message = require("../modules/directory/chat/message.model");

let io; // Socket.IO instance

// function initializeSocketIO(server) {
//     io = new Server(server, {
//         cors: {
//             origin: '*:*',
//         }
//     });

//     io.on('connection', (socket) => {
//         console.log('A user connected');

//         // You can handle common events here if needed

//         socket.on('disconnect', () => {
//             console.log('User disconnected');
//         });
//     });
// }

function initializeSocketIO(server) {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // PRESENCE: Mark user online
    const userId = socket.handshake.query.userId; // pass from client
    if (userId) {
      io.emit("user:online", { userId });
    }

    // Join conversation room
    socket.on("joinRoom", (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined room ${conversationId}`);
    });

    // SEND MESSAGE
    socket.on("sendMessage", async (data, callback) => {
      try {
        const { conversationId, senderId, text, type,attachments } = data;

        // 1) Ensure conversation exists
        const convo = await Conversation.findById(conversationId);
        if (!convo) return callback?.({ ok: false, error: "Conversation not found" });

        // 2) Create new message
        const message = await Message.create({
          attachments,
          conversation: conversationId,
          sender: senderId,
          type: type || "text",
          text,
          statuses: convo.participants
            .filter((p) => String(p.user) !== String(senderId))
            .map((p) => ({ user: p.user, deliveredAt: null, seenAt: null })),
          createdAt: new Date(),
        });
        
        // 3) Update conversation lastMessage
        convo.lastMessage = {
          _id: message._id,
          text: message.text,
          sender: message.sender,
          createdAt: message.createdAt,
        };
        await convo.save();

        // 4) Emit to conversation room
        io.to(conversationId).emit("message:new", {
          _id: message._id,
          conversation: conversationId,
          sender: senderId,
          text,
          type: type || "text",
          createdAt: message.createdAt,
        });

        callback?.({ ok: true, message });
      } catch (err) {
        console.error("Error sending message:", err);
        callback?.({ ok: false, error: err.message });
      }
    });

    // MESSAGE RECEIPTS (delivered/seen)
    socket.on("message:receipt", async ({ messageId, type, userId }, callback) => {
      try {
        const now = new Date();
        const update = {};
        if (type === "delivered") update["statuses.$.deliveredAt"] = now;
        if (type === "seen") update["statuses.$.seenAt"] = now;

        const msg = await Message.findOneAndUpdate(
          { _id: messageId, "statuses.user": userId },
          { $set: update },
          { new: true }
        ).populate("conversation");

        if (!msg) return callback?.({ ok: false, error: "Message not found" });

        // Notify everyone in conversation
        io.to(String(msg.conversation._id)).emit("message:receipt", {
          messageId,
          userId,
          type,
          at: now,
        });

        callback?.({ ok: true });
      } catch (err) {
        console.error("Receipt error:", err);
        callback?.({ ok: false, error: err.message });
      }
    });

    // TYPING START
    socket.on("typing:start", (conversationId) => {
      socket.to(conversationId).emit("typing", { conversationId, userId, isTyping: true });
    });

    //  TYPING STOP
    socket.on("typing:stop", (conversationId) => {
      socket.to(conversationId).emit("typing", { conversationId, userId, isTyping: false });
    });

    socket.on("sync:resume", async ({ since }) => {
    try {
      const userId = String(socket.user._id);
      const convos = await Conversation.find({ "participants.user": userId }).select("_id");
      const convoIds = convos.map(c => c._id);
      const sinceDate = since ? new Date(since) : new Date(0);
      const batch = await Message.find({ conversation: { $in: convoIds }, createdAt: { $gt: sinceDate } })
        .sort({ createdAt: 1 })
        .limit(500)
        .lean();
      socket.emit("sync:batch", { items: batch, nextCursor: batch.length ? batch[batch.length - 1].createdAt : null });
    } catch (e) {
      socket.emit("error", { scope: "sync:resume", message: e.message });
    }
  });

    // PRESENCE: Mark user offline on disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      if (userId) {
        io.emit("user:offline", { userId });
      }
    });
  });
}

function emitEvent(eventName, data) {
    if (io) {
        io.emit(eventName, data);
    } else {
        console.error('Socket.IO not initialized');
    }
}

module.exports = {
    initializeSocketIO,
    emitEvent,
};