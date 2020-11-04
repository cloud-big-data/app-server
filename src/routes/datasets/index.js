const express = require('express');

const router = express.Router();

router.use('/', require('./datasets_routes'));

module.exports = router;
