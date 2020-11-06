import cors from 'cors';

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');

export const app = express();

require('./models').connect(config.dbUri);

const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin:
    process.env.ENVIRONMENT === 'dev'
      ? 'http://localhost:3000'
      : 'https://app.skyvue.io',
  optionsSuccessStatus: 200,
};

// app.set('trust proxy', true);
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', async (req, res) => {
  res.send('hello from Skyvue!!');
});

app.get('/health_check', async (req, res) => {
  res.json({ status: 200, alive: true });
});

app.use(require('./routes'));

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
