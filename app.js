require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const twitch = require('./custom_modules/twitch');
const { encrypt } = require('./custom_modules/crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const http = require('http');
const DevPubSubServer = require('./custom_modules/dev-pubsub');

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');

var app = express();
const server = http.createServer(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public_internal'),{index:false,extensions:['html']}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply security middleware
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? '*' 
    : ['https://your-production-domain.com']
}));

app.use('/', indexRouter);
app.use('/admin', adminRouter);

// Development routes - make sure these come before the 404 handler
console.log("NODE_ENV: " + process.env.NODE_ENV);

// Remove the existing Socket.IO initialization since it's now in DevPubSubServer
if (process.env.NODE_ENV === 'development') {
  const devPubSub = new DevPubSubServer(server);
  app.set('devPubSub', devPubSub);
  // Export the Socket.IO instance
  module.exports.io = devPubSub.io;
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Export the app and server
module.exports = { app, server };
