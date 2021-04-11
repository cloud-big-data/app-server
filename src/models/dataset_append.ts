import Mongoose, { Schema, Document } from 'mongoose';

export interface DatasetAppend extends Document {
  userId: string;
  datasetId: string;
  beginningRowCount: number;
  endingRowCount: number;
}

const Append = new Schema(
  {
    userId: Mongoose.Types.ObjectId,
    datasetId: Mongoose.Types.ObjectId,
    beginningRowCount: Number,
    endingRowCount: Number,
  },
  {
    timestamps: true,
  },
);

const model = Mongoose.model<DatasetAppend>('append', Append);

export default model;
