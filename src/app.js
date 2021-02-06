import cors from 'cors';

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');

export const app = express();

require('./models').connect(config.dbUri);

const PORT = process.env.PORT || 5000;

const CORS_LOOKUP = {
  development: ['http://localhost:3000'],
  staging: [],
  production: 'app.skyvue.io',
};

const corsOptionsDelegate = function (req, callback) {
  const allowList = CORS_LOOKUP[process.env.ENVIRONMENT];
  const corsOptions =
    req.header('Origin').includes('netlify.app') ||
    allowList.indexOf(req.header('Origin')) !== -1
      ? { origin: true }
      : { origin: false };
  callback(null, corsOptions); // callback expects two parameters: error and options
};

app.use(cors(corsOptionsDelegate));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', async (req, res) => {
  res.send('hello from Skyvue!');
});

app.get('/health_check', async (req, res) => {
  res.json({ status: 200, alive: true });
});

app.use(require('./routes'));

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
