import refreshUser from '../routes/auth/lib/refreshUser';
import verifyAccessToken from '../lib/verifyAccessToken';
import User, { loadUser } from '../models/user';

const authCheck = async (req, res, next) => {
  const accessToken = req.headers.authorization.substring('bearer '.length);
  const refreshToken = req.headers['x-refresh-token'];

  const {error, ...decodedAccessToken} = verifyAccessToken(accessToken, process.env.JWT_SECRET);

  if (!accessToken || !refreshToken) {
    return res.status(401).json({ error: "invalid_token" })
  }

  console.log(decodedAccessToken);
  const user = await loadUser(decodedAccessToken.userId);
  req.user = user;

  next();
}

export default authCheck;