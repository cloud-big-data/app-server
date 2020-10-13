const express = require('express');

const router = new express.Router();

router.use('/', require('./userRoutes'));

module.exports = router;