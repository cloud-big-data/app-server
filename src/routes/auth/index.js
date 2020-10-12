const express = require('express');

const router = new express.Router();

router.use('/user', require('./userService'));

module.exports = router;
