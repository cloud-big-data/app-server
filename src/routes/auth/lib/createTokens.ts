const jwt = require('jsonwebtoken');

const createTokens = ({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): { accessToken: any; refreshToken: any } => {
  const accessToken = jwt.sign(
    {
      userId,
      email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );

  const refreshToken = jwt.sign(
    {
      userId,
      email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '14 days' },
  );

  return {
    accessToken,
    refreshToken,
  };
};

export default createTokens;
