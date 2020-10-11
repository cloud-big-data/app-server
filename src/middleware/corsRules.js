import cors from 'cors';

const corsOptions = {
  origin: process.env.ENV === 'dev' ? 'http://localhost:3000' : 'https://skyvue.io',
  optionsSuccessStatus: 200,
};

module.exports = () => cors(corsOptions);
