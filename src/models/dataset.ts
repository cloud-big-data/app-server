import Mongoose, { Schema, Document } from 'mongoose';

interface IDataset extends Document {
  userId: string;
  title: string;
  visibilitySettings: {
    owner: string;
    editors: string[];
    viewers: string[];
  };
  updatedAt: string;
  createdAt: string;
}

const Dataset = new Schema(
  {
    userId: String,
    title: String,
    visibilitySettings: {
      owner: String,
      editors: [String],
      viewers: [String],
    }
  },
  {
    timestamps: true,
  }
)

const model = Mongoose.model<IDataset>('dataset', Dataset);

export default model;