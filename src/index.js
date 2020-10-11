import corsRules from './middleware/corsRules';

require('dotenv').config();
const express = require('express');
const config = require('./config');

export const app = express();

require('./models').connect(config.dbUri);

const PORT = process.env.PORT || 5000;

app.use(corsRules());
app.get('/', async (req, res) => {
  res.send('hello from Skyvue!');
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
