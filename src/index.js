import corsRules from './middleware/corsRules';

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');

export const app = express();

require('./models').connect(config.dbUri);

const PORT = process.env.PORT || 5000;

app.use(corsRules());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', async (req, res) => {
  res.send('hello from Skyvue!');
});

app.use(require('./routes'));

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
