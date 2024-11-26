const { User } = require('../models/user.model');

const avatars = [
  'https://cdn-icons-png.flaticon.com/512/6997/6997662.png',
  'https://cdn-icons-png.flaticon.com/128/1999/1999625.png',
  'https://cdn-icons-png.flaticon.com/128/2202/2202112.png',
  'https://cdn-icons-png.flaticon.com/128/4333/4333609.png',
  'https://cdn-icons-png.flaticon.com/128/4140/4140047.png',
  'https://cdn-icons-png.flaticon.com/128/706/706830.png',
  'https://cdn-icons-png.flaticon.com/128/706/706816.png',
  'https://cdn-icons-png.flaticon.com/128/219/219970.png',
  'https://cdn-icons-png.flaticon.com/128/706/706831.png',
  'https://cdn-icons-png.flaticon.com/128/4139/4139951.png',
  'https://cdn-icons-png.flaticon.com/128/4140/4140040.png',
  'https://cdn-icons-png.flaticon.com/128/2552/2552801.png',
  'https://cdn-icons-png.flaticon.com/128/4140/4140051.png',
  'https://cdn-icons-png.flaticon.com/128/1154/1154473.png',
  'https://cdn-icons-png.flaticon.com/128/4140/4140077.png',
];

const login = async (req, res) => {
  try {
    const { userName } = req.body;

    let user = await User.findOne({
      userName: { $regex: new RegExp('^' + userName.trim() + '$', 'i') },
    }).lean();

    if (!user) {
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
      user = new User({
        userName: userName.trim(),
        avatar: randomAvatar,
      });

      await user.save();
    }

    return res.json({
      user: { ...user, _id: user._id.toString() },
    });
  } catch (error) {
    console.error('Error in login API:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { login };
