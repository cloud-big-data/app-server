import verifyRefreshToken from './verifyRefreshToken';
import User from '../../../models/user';
import createTokens from './createTokens';

const refreshUser = async (refreshToken: string): Promise<any> => {
  const decodedRefreshToken = verifyRefreshToken(
    refreshToken,
    process.env.JWT_SECRET,
  );

  if (decodedRefreshToken.error) {
    return {
      error: decodedRefreshToken.name,
    };
  }

  const user = await User.findById(decodedRefreshToken.userId).lean().exec();

  if (user.shouldLogOut) {
    return { error: 'Authorization error' };
  }

  const newTokens = createTokens({
    userId: user._id,
    email: decodedRefreshToken.email,
  });

  return newTokens;
};

export default refreshUser;
