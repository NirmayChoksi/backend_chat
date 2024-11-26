const express = require('express');
const {
  createGroup,
  addGroupMembers,
  removeGroupMember,
  getGroupInfo,
  changeAdminStatus,
} = require('../controllers/group.controller');

const router = express.Router();

router.post('/', createGroup);

router.get('/:groupId', getGroupInfo);

router.post('/:groupId/user', addGroupMembers);

router.delete('/:groupId/user', removeGroupMember);

router.patch('/:groupId/admin', changeAdminStatus);

module.exports = router;
