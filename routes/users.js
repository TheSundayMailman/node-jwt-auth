'use strict';

const express = require('express');
const passport = require('passport');

const { User } = require('../models/user.js');

const router = express.Router();

// create instance of jwtAuth in case a path needs to be protected
const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

/* ======================= POST (create) a new user ======================= */
router.post('/', (req, res, next) => {
  // Validate fields in request body
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));
  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  const stringFields = ['username', 'password', 'firstName', 'lastName'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );
  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  // If the username and password aren't trimmed we give an error.
  // Users might expect that these will work without trimming (i.e. they want the password "foobar ", including the space at the end).
  // Reject such values explicitly so the users know what's happening, rather than quietly trimming them and expecting the user to understand.
  // Quietly trim the other fields, because they aren't credentials used to log in, so it's less of a problem.
  const trimmedFields = ['username', 'password'];
  const nonTrimmedField = trimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );
  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }

  // bcrypt truncates after 72 characters, so let's not give the illusion of security by storing extra (unused) info.
  const sizedFields = {
    username: { min: 5, max: 72 },
    password: { min: 10, max: 72 }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
  );
  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }

  // All validations passed
  let { username, password, firstName='', lastName='' } = req.body;
  // Username and password come in pre-trimmed, otherwise an error would have been thrown before reaching here.
  firstName = firstName.trim();
  lastName = lastName.trim();

  return User
    .find({ username })
    .countDocuments()
    .then(count => {
      if (count > 0) {
        // There is an existing user with the same username.
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      // If there is no existing user, hash the password.
      return User.hashPassword(password);
    })
    .then(hash => User.create({
      username,
      password: hash,
      firstName,
      lastName,
    }))
    .then(user => res.status(201).json(user.serialize()))
    .catch(err => {
      // Forward validation errors on to the client, otherwise give a 500 error because something unexpected has happened.
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      return res.status(500).json({
        code: 500,
        message: 'Internal server error'
      });
    });
});

// Never expose all your users like below in a prod application we're just doing this so we have a quick way to see if we're creating users.
// Keep in mind, you can also verify this in the Mongo shell.
// router.get('/', (req, res, next) => {
//   return User
//     .find()
//     .then(users => res.json(users.map(user => user)))
//     .catch(err => res.status(500).json({ message: 'Internal server error' }));
// });

module.exports = { router };
