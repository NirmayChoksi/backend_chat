const { Chat } = require('../models/chat.model');
const { Group } = require('../models/group.model');
const { User } = require('../models/user.model');

const getUserChats = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(404).json({ error: 'User id required' });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userGroups = await Group.find(
      { 'userInfo.user': userId },
      '_id avatar name'
    ).lean();
    const groupIds = userGroups.map((group) => group._id.toString());

    const chats = await Chat.find({
      $or: [{ to: user }, { from: user }, { to: { $in: groupIds } }],
      status: 'ACTIVE',
    })
      .sort({ createdAt: -1 })
      .populate('to')
      .populate('from')
      .lean();

    const userChats = {};

    chats.forEach((message) => {
      let key;
      let chatId;
      let avatar;
      if (message.toRef === 'Group') {
        key = message.to.name;
        chatId = message.to._id;
        avatar = message.to.avatar;
      } else {
        key =
          message.to._id.toString() === userId
            ? message.from.userName
            : message.to.userName;
        chatId =
          message.to._id.toString() === userId
            ? message.from._id
            : message.to._id;
        avatar =
          message.to._id.toString() === userId
            ? message.from.avatar
            : message.to.avatar;
      }

      if (!userChats[key]) {
        userChats[key] = [];
      }

      userChats[key].push({
        from: message.from.userName,
        message: message.content,
        createdAt: message.createdAt,
        isGroup: message.isGroup,
        chatId: chatId,
        avatar,
      });
    });

    userGroups.forEach((group) => {
      if (!userChats[group.name]) {
        userChats[group.name] = [
          {
            from: group.name,
            message: null,
            createdAt: null,
            isGroup: true,
            chatId: group._id,
            avatar: group.avatar,
          },
        ];
      }
    });

    return res.json({ chats: userChats });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return res.status(500).json({ error: 'Error fetching chats' });
  }
};

module.exports = { getUserChats };
