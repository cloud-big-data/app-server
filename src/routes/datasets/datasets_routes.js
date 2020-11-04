const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');

const results = [];

const router = new express.Router();

router.post('/upload', (req, res) => {
  const { file } = req.body;
  const buff = Buffer.from(file, 'base64');
  const text = buff.toString('ascii');
  console.log(text, file);
  // fs.createReadStream('data.csv')
  //   .pipe(csv())
  //   .on('data', data => results.push(data))
  //   .on('end', () => {
  //     console.log(results);
  //     // [
  //     //   { NAME: 'Daffy Duck', AGE: '24' },
  //     //   { NAME: 'Bugs Bunny', AGE: '22' }
  //     // ]
  //   });
});

module.exports = router;
