const mongoose = require("mongoose");

function handleMongoError(err) {
  console.error(`Mongoose connection error: ${err}`);
  process.exit(1);
}

module.exports.connect = async (uri: string) => {
  await mongoose
    .connect(uri, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true,
    })
    .catch(handleMongoError);

  mongoose.connection.on("error", handleMongoError);
};

module.exports.close = () => {
  mongoose.connection.close();
};
