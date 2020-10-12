import Mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: number;
  password: string;
  stripeId: string;
  roles: string;
  refreshAuthCount: number;
}

const User = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: Number,
    password: String,
    stripeId: {
      type: String,
    },
    roles: {
      type: [String],
      enum: ['admin', 'editor', 'viewOnly'],
      default: 'admin',
    },
    refreshAuthCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const model = Mongoose.model<IUser>('user', User);

export default model;
