const jwt = require('jsonwebtoken');

const makePasswordResetToken = (
  userId: string
): string => {
  const accessToken =  jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m'},
  );

  return accessToken;
}

export default makePasswordResetToken;