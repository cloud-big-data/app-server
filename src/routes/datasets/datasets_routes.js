const express = require('express');
const csv = require('csvtojson');
const fs = require('fs');
const expressUpload = require('express-fileupload');

const results = [];

const router = new express.Router();

router.use(expressUpload());
router.post('/upload', (req, res) => {
  csv()
    .fromString(req.files.csv.data.toString('utf8'))
    .on('data', data => {
      const jsonStr = data.toString('utf8');
      console.log(jsonStr);
    })
    .on('done', () => {
      console.log('done parsing');
    });

  res.sendStatus(200);
});

module.exports = router;
