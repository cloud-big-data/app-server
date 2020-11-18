const jwt = require('jsonwebtoken');

const createTokens = (
  { userId, email, count }: { userId: string; email: string; count: number; }
): { accessToken: any; refreshToken: any; } => {
  const accessToken =  jwt.sign(
    {
      userId,
      email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m'},
  );

  const refreshToken = jwt.sign(
    {
      userId,
      email,
      count,
    },
    process.env.JWT_SECRET,
    { expiresIn: '14 days' }
  );

  return {
    accessToken,
    refreshToken,
  }
}

export default createTokens;