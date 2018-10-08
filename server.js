'use strict';

require('dotenv').config();

const express = require('express');
const formData = require('express-form-data');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');

const { PORT, CLIENT_ORIGIN, DATABASE_URL } = require('./config.js');
// const { dbConnect } = require('./db-mongoose.js');
// const { dbConnect } = require('./db-knex.js');

// Here we use destructuring assignment with renaming so the two variables called router (from ./users and ./auth) have different names.
// For example:
// const actorSurnames = { james: "Stewart", robert: "De Niro" };
// const { james: jimmy, robert: bobby } = actorSurnames;
// console.log(jimmy); // Stewart - the variable name is jimmy, not james
// console.log(bobby); // De Niro - the variable name is bobby, not robert
const { router: usersRouter } = require('./routes/users.js');
const { router: authRouter } = require('./routes/auth.js');
const { localStrategy } = require('./passport/local.js');
const { jwtStrategy } = require('./passport/jwt.js');

// Initialize instances
const app = express();
mongoose.Promise = global.Promise;
passport.use(localStrategy);
passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

// Logging
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
    skip: (req, res) => process.env.NODE_ENV === 'test'
  })
);

// Parsing JSON and form data
app.use(express.json());
app.use(formData.parse());

// Create a static webserver
// app.use(express.static('public'));

// CORS
app.use(cors({ origin: CLIENT_ORIGIN }));
// CORS settings explicitly defined if 'cors' dependency is not used
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
//   res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
//   if (req.method === 'OPTIONS') return res.send(204);
//   next();
// });

// Routes
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);

// An unprotected endpoint for pinging server response
app.get('/api', (req, res, next) => {
  return res.json({ message: 'server active' });
});

// A protected endpoint which needs a valid JWT to access it
app.get('/api/protected', jwtAuth, (req, res, next) => {
  return res.json({ data: 'rosebud' });
});

// Catch-all path for anything else that deviates from above routes
// app.use('*', (req, res, next) => {
//   return res.status(404).json({ message: 'Not Found' });
// });

// Custom 404 Not Found route handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Custom Error Handler
app.use((err, req, res, next) => {
  if (err.status) {
    const errBody = Object.assign({}, err, { message: err.message });
    return res.status(err.status).json(errBody);
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.error(err);
    }
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Referenced by both runServer and closeServer.
// closeServer assumes runServer has run and set `server` to a server object.
let server;

function runServer(databaseUrl, port=PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) return reject(err);
      server = app
        .listen(port, () => {
          console.log(`Your app is listening on port ${port}`);
          return resolve();
        })
        .on('error', err => {
          mongoose.disconnect();
          return reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose
    .disconnect()
    .then(() => {
      return new Promise((resolve, reject) => {
        console.log('Closing server');
        server.close(err => {
          if (err) return reject(err);
          return resolve();
        });
      });
    });
}

if (require.main === module) runServer(DATABASE_URL).catch(err => console.error(err));

module.exports = { app, runServer, closeServer };
