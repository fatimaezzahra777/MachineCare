require('dotenv').config();  
const app = require('./app');
const connectDB = require('./config/db');

connectDB()
  .then(() => app.listen(PORT, ...))  
  .catch(...)                          