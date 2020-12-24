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
  updatedAt: string;
  createdAt: string;
  lastLoggedIn: string;
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
    lastLoggedIn: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const model = Mongoose.model<IUser>('user', User);

export const loadUser = async (userId: string) => {
  const user = await model.findById(userId).lean().exec();

  return {
    _id: user?._id,
    roles: user?.roles,
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    phone: user?.phone,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
    lastLoggedIn: user?.lastLoggedIn,
  };
};

export default model;
