const express = require('express');
import User, { loadUser } from '../../models/user';

const router = new express.Router();

router.get('/me/:userId', async (req, res) => {
  const {userId} = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'userId must be specified' })
  }

  if (userId !== req.user._id.toString()) {
    return res.status(401).json({ error: '/me/:userId can only lookup the user information for the user sending the request' })
  }

  const user = await loadUser(userId);
  res.json({ ...user })
})

module.exports = router;