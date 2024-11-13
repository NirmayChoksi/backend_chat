const mongoose = require('mongoose');

const { Schema } = mongoose;

const MessageStatus = {
  active: 'ACTIVE',
  deleted: 'DELETED',
};

const chatSchema = new Schema(
  {
    from: { type: String }, // sender's userId (can be ObjectId if referencing User model)
    to: { type: String }, // recipient's userId or groupId (can be ObjectId if referencing Group/User)
    isGroup: { type: Boolean }, // Whether it's a group message or a private message
    content: { type: String },
    imageUrl: { type: [String] }, // Array of image URLs
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.active,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Define the model based on the schema
const Chat = mongoose.model('Chat', chatSchema);

module.exports = { Chat };
