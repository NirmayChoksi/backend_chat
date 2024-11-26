const mongoose = require('mongoose');

const { Schema } = mongoose;

const groupSchema = new Schema(
  {
    userInfo: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        isAdmin: { type: Boolean, required: true },
      },
    ],
    name: { type: String, required: true },
    avatar: { type: String, required: true },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const Group = mongoose.model('Group', groupSchema);

module.exports = { Group };
