const express = require('express');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));

app.use(notFound);      
app.use(errorHandler); 

module.exports = app;
