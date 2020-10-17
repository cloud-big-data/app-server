import Mongoose, { Schema, Document } from 'mongoose';

interface ISecurityLog extends Document {
  description: string;
  userId: string;
  ipAddress: string;
  updatedAt: string;
  createdAt: string;
}

const SecurityLog = new Schema(
  {
    description: String,
    userId: Mongoose.Types.ObjectId,
    ipAddress: String,
  },
  {
    timestamps: true,
  }
)

const model = Mongoose.model<ISecurityLog>('security_log', SecurityLog);

export default model;