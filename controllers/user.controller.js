const { User } = require('../models/user.model');

const getUsers = async (req, res) => {
  try {
    const { excludeIds = [] } = req.query; // Expect a query parameter 'excludeIds' as an array
    const excludeArray = Array.isArray(excludeIds)
      ? excludeIds.map((id) => id.toString())
      : [excludeIds.toString()];

    const users = await User.find({ _id: { $nin: excludeArray } }).lean();

    return res.json({
      users: users.map((u) => {
        return { ...u, _id: u._id.toString() };
      }),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Error fetching users' });
  }
};

const getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).lean();

    return res.json({
      user: { ...user, _id: user._id.toString() },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Error fetching chats' });
  }
};

module.exports = { getUsers, getUser };
