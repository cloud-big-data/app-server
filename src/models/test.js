const Mongoose = require('mongoose');

const test = new Mongoose.Schema(
  {
    testName: String,
  },
  { timestamps: true },
);

module.exports = Mongoose.model('test', test);
