import express from 'express';
import { IUser } from 'models/user';

export interface AuthenticatedRoute<Body = any> extends express.Request {
  user: IUser & { _id: string };
  body: Body;
}
