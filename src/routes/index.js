import authCheck from '../middleware/authCheck';

const express = require('express');

const router = new express.Router();

router.use('/auth', require('./auth'));

router.use('/users', authCheck);
router.use('/users', require('./user'));

module.exports = router;
