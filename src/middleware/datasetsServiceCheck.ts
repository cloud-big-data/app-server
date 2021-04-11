import { Request, Response, NextFunction } from 'express';

const datasetsServiceCheck = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { headers } = req;
  if (!headers.secret || headers.secret !== process.env.DATASET_SERVICE_SECRET) {
    return res.sendStatus(401);
  }
  next();
};

export default datasetsServiceCheck;
