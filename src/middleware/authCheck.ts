import { Response, NextFunction } from 'express';
import { AuthenticatedRoute } from 'types/requestTypes';
import verifyAccessToken from '../lib/verifyAccessToken';
import { loadUser } from '../models/user';

const authCheck = async (
  req: AuthenticatedRoute,
  res: Response,
  next: NextFunction,
) => {
  if (!req.headers?.authorization) {
    return res.status(401).json({ error: 'logged_out' });
  }

  const accessToken = req.headers.authorization.substring('bearer '.length);

  const { error, ...decodedAccessToken } = verifyAccessToken(
    accessToken,
    process.env.JWT_SECRET,
  );

  if (!accessToken || !decodedAccessToken.userId) {
    return res.status(401).json({ error: 'invalid_token' });
  }

  const user = await loadUser(decodedAccessToken.userId);

  if (user.shouldLogOut) return res.status(401).json({ error: 'logged_out' });
  req.user = user;

  next();
};

export default authCheck;
