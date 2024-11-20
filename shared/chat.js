const { Server } = require('socket.io');
const { Chat } = require('../models/chat.model.js');

const MessageStatus = {
  active: 'ACTIVE',
  deleted: 'DELETED',
};

let io;
const users = new Map();
const groups = new Map();

const initializeSocketIo = (server) => {
  io = new Server(server, {
    cors: {
      origins: ['*'],
      handlePreflightRequest: (req, res) => {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST',
          'Access-Control-Allow-Headers': 'my-custom-header',
          'Access-Control-Allow-Credentials': true,
        });
        res.end();
      },
    },
  });
  handleNewConnection();
  console.log('Socket.io setup complete');
};

const handleNewConnection = () => {
  io.on('connection', (socket) => {
    const { userId } = socket.handshake.query;
    users.set(userId, socket.id);

    socket.on(
      'send_private_message',
      async ({ from, to, content, imageUrl }) => {
        // Handle private message
        const newMessage = await Chat.create({
          from,
          to,
          content,
          isGroup: false,
          imageUrl,
        }).populate('from');
        const recipientId = users.get(to);

        const sender = users.get(from);
        if (recipientId) {
          io.to([recipientId, sender]).emit('private_message', newMessage);
        } else {
          io.to([sender]).emit('private_message', newMessage);
        }
      }
    );

    socket.on('join_group', ({ groupId, userId }) => {
      // Handle user joining a group
      socket.join(groupId);
      if (!groups.has(groupId)) {
        groups.set(groupId, new Set());
      }

      groups.get(groupId).add(userId);
      console.log(`User ${userId} joined group ${groupId}`);
    });

    socket.on(
      'send_group_message',
      async ({ from, groupId, content, imageUrl }) => {
        // Handle group message
        const newMessage = await Chat.create({
          from,
          to: groupId,
          toRef: 'Group',
          content,
          isGroup: true,
          imageUrl,
        }).populate('from');
        const groupMembers = groups.get(groupId);
        if (groupMembers) {
          io.to(groupMembers).emit('group_message', newMessage);
        }
      }
    );

    socket.on('fetch_messages', async ({ userId, chatWithId, isGroup }) => {
      // Handle fetching message history
      const messages = await Chat.find({
        $or: [
          { from: userId.trim(), to: chatWithId.trim(), isGroup },
          { from: chatWithId.trim(), to: userId.trim(), isGroup },
        ],
      })
        .populate('from')
        .sort({ timestamp: 1 });

      socket.emit('message_history', messages);
    });

    socket.on('delete_message', async ({ message, userId }) => {
      // Handle message deletion
      if (message.from.toString().trim() !== userId.toString().trim()) {
        throw new Error('Cannot delete this message.', 401);
      }

      const deletedMessage = await Chat.findByIdAndUpdate(message['_id'], {
        $set: { status: MessageStatus.deleted },
      });

      if (!deletedMessage) {
        throw new Error('Message not found.', 404);
      }

      const recipientId = users.get(deletedMessage.to);
      const sender = users.get(deletedMessage.from);
      if (recipientId) {
        io.to([recipientId, sender]).emit('message_deleted', deletedMessage.id);
      }
      console.log('Deleted message:', deletedMessage);
    });

    socket.on('typing', ({ to, typing }) => {
      // Handle typing indication
      const recipientId = users.get(to);
      if (recipientId) {
        io.to(recipientId).emit('user_typing', typing);
      }
    });
  });
};

module.exports = { initializeSocketIo };
