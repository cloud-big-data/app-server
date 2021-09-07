import express from 'express';
import { IUser } from 'models/user';
import { IDataset } from 'models/dataset';

export interface AuthenticatedRoute<Body = any> extends express.Request {
  user: IUser & { _id: string };
  body: Body;
  dataset?: IDataset;
}
