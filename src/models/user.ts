import Mongoose, { Schema, Document } from 'mongoose';

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: number;
  password: string;
  stripeId: string;
  roles: string;
  refreshAuthCount: number;
  shouldLogOut: boolean;
  updatedAt: string;
  createdAt: string;
  lastLoggedIn: string;
}

export interface IUserSchema extends Document, IUser {}

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
    shouldLogOut: Boolean,
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

const model = Mongoose.model<IUserSchema>('user', User);

export const loadUser = async (userId: string): Promise<IUser & { _id: string }> => {
  if (!userId) return;
  return model.findById(userId).lean().exec();
};

export default model;
