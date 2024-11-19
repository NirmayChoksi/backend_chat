const mongoose = require('mongoose');

const { Schema } = mongoose;

const groupSchema = new Schema(
  {
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    name: { type: String },
    avatar: { type: String },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const Group = mongoose.model('Group', groupSchema);

module.exports = { Group };
