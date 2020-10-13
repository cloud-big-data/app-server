import jwt from 'jsonwebtoken';

const verifyAccessToken = (refreshToken: string, secret: string) => {
  try {
    const valid = jwt.verify(refreshToken, secret);
    return valid;
  } catch (e) {
    return {
      error: true,
      ...e
    };
  }
}

export default verifyAccessToken;