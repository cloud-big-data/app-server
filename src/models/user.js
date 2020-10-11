const Mongoose = require('mongoose');

const User = new Mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    roles: {
      type: String,
      enum: ['admin', 'editor', 'viewOnly'],
    },
    phone: Number,
    password: String,
    stripeId: String,
    refreshAuthCount: Number,
  },
  {
    timestamps: true,
  },
);

module.exports = Mongoose.model('user', User);
