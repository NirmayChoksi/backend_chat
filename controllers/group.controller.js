const { Group } = require('../models/group.model');
const { User } = require('../models/user.model');

const createGroup = async (req, res) => {
  try {
    const { userInfo, name } = req.body;

    const users = await User.find({
      _id: { $in: userInfo.map((u) => u.user) },
    }).lean();
    if (userInfo.length !== users.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const avatars = [
      'https://cdn-icons-png.flaticon.com/128/1474/1474494.png',
      'https://cdn-icons-png.flaticon.com/128/6556/6556024.png',
      'https://cdn-icons-png.flaticon.com/128/4596/4596136.png',
    ];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newGroup = new Group({ userInfo, name, avatar: randomAvatar });
    await newGroup.save();

    return res.status(200).json({
      message: 'Group successfully created.',
      id: newGroup._id.toString(),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error creating group' });
  }
};

const getGroupInfo = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate('userInfo.user')
      .lean();

    return res.json({
      group,
    });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return res.status(500).json({ error: 'Error fetching chats' });
  }
};

const addGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body;

    const users = await User.find({ _id: { $in: userIds } }).lean();
    if (users.length !== userIds.length) {
      return res.status(404).json({ error: 'Some users not found' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const newUsers = userIds.filter(
      (userId) => !group.userInfo.some((u) => u.user.toString() === userId)
    );

    if (newUsers.length === 0) {
      return res
        .status(400)
        .json({ error: 'All users are already in the group' });
    }

    group.userInfo.push(
      ...newUsers.map((userId) => ({
        user: userId,
        isAdmin: false,
      }))
    );

    await group.save();

    return res.status(200).json({
      message: `${newUsers.length} user(s) added to the group`,
    });
  } catch (error) {
    console.error('Error adding users to group:', error);
    return res.status(500).json({ error: 'Error adding users to group' });
  }
};

const removeGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params; 

    const { userId } = req.query; 
    if (!userId) {
      return res.status(404).json({ error: 'User id required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    group.userInfo = group.userInfo.filter((u) => userId !== u.user.toString());

    await group.save();

    return res.status(200).json({
      message: `User removed from the group successfully`,
    });
  } catch (error) {
    console.error('Error removing user from group:', error);
    return res.status(500).json({ error: 'Error removing user from group' });
  }
};

const changeAdminStatus = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, newStatus } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    if (typeof newStatus !== 'boolean') {
      return res.status(400).json({ error: 'New status must be a boolean.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    const user = group.userInfo.find((u) => u.user.toString() === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found in the group.' });
    }

    user.isAdmin = newStatus;

    await group.save();

    return res.status(200).json({
      message: `User's admin status successfully updated.`,
    });
  } catch (error) {
    console.error('Error updating admin status:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while updating admin status.' });
  }
};

module.exports = {
  createGroup,
  getGroupInfo,
  addGroupMembers,
  removeGroupMember,
  changeAdminStatus,
};
