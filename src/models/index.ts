import mongoose from 'mongoose';

import Dataset from './dataset';
import User from './user';

const m = {
  Dataset,
  User,
};

const handleMongoError = err => {
  console.error(`Mongoose connection error: ${err}`);
  process.exit(1);
};

export default m;

module.exports.DatasetAppend = require('./dataset_append');
module.exports.User = require('./user');
module.exports.SecurityLog = require('./securityLog');

module.exports.connect = async (uri: string) => {
  await mongoose
    .connect(uri, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true,
    })
    .catch(handleMongoError);

  mongoose.connection.on('error', handleMongoError);
};

module.exports.close = () => {
  mongoose.connection.close();
};
