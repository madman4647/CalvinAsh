const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { createApp } = require('./app');

const port = process.env.PORT || 5000;
const app = createApp();

app.listen(port, () => {
  console.log(`Calvin server listening on port ${port}`);
});
