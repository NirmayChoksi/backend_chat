const mongoose = require('mongoose');

const { Schema } = mongoose;

const groupSchema = new Schema(
  {
    users: [{ type: String }],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const Group = mongoose.model('Group', groupSchema);

module.exports = { Group };
