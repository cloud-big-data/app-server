import { Response, NextFunction } from 'express';
import { AuthenticatedRoute } from 'types/requestTypes';
import verifyAccessToken from '../lib/verifyAccessToken';
import { loadUser } from '../models/user';

const authCheck = async (
  req: AuthenticatedRoute,
  res: Response,
  next: NextFunction,
) => {
  const accessToken = req.headers.authorization.substring('bearer '.length);
  const refreshToken = req.headers['x-refresh-token'];

  const { error, ...decodedAccessToken } = verifyAccessToken(
    accessToken,
    process.env.JWT_SECRET,
  );

  if (!accessToken || !refreshToken || !decodedAccessToken.userId) {
    return res.status(401).json({ error: 'invalid_token' });
  }

  const user = await loadUser(decodedAccessToken.userId);
  req.user = user;

  next();
};

export default authCheck;
