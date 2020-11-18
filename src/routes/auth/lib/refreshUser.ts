import verifyRefreshToken from "./verifyRefreshToken";
import User from '../../../models/user';
import createTokens from "./createTokens";

const refreshUser = async (refreshToken: string): Promise<any> => {
  const decodedRefreshToken = verifyRefreshToken(refreshToken, process.env.JWT_SECRET);

  if (decodedRefreshToken.error) {
    return {
      error: decodedRefreshToken.name,
    }
  }

  const user = await User.findById(decodedRefreshToken.userId).lean().exec();

  if (user.refreshAuthCount !== decodedRefreshToken.count) {
    const date = new Date();
    console.log(`error at ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`, user, decodedRefreshToken);
    return { error: 'Authorization error' }
  }

  const userWithUpdatedCount = await User.findByIdAndUpdate(user._id, {
    refreshAuthCount: user.refreshAuthCount + 1,
  }, { new: true }).exec();
  
  const newTokens = createTokens({
    userId: user._id,
    email: decodedRefreshToken.email,
    count: userWithUpdatedCount.refreshAuthCount,
  });

  return newTokens;
}

export default refreshUser;