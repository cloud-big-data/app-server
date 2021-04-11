const express = require('express');

const router = express.Router();

router.use('/append', require('./append_routes'));
router.use('/', require('./datasets_routes'));

module.exports = router;
