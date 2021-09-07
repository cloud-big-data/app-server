import Mongoose, { Schema, Document } from 'mongoose';

export interface IDataset extends Document {
  isProcessing: boolean;
  userId: string;
  title: string;
  visibilitySettings: {
    isPublic: boolean;
    owner: string;
    editors: string[];
    viewers?: string[];
  };
  updatedAt?: string;
  createdAt?: string;
}

const Dataset = new Schema(
  {
    isProcessing: {
      type: Boolean,
      default: true,
    },
    userId: String,
    title: String,
    visibilitySettings: {
      isPublic: {
        type: Boolean,
        default: false,
      },
      owner: String,
      editors: [String],
      viewers: [String],
    },
  },
  {
    timestamps: true,
  },
);

const model = Mongoose.model<IDataset>('dataset', Dataset);

export default model;
