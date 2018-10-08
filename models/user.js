'use strict';

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
});

// Add `createdAt` and `updatedAt` fields
UserSchema.set('timestamps', true);

// Customize output for `res.json(data)`, `console.log(data)` etc.
UserSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.password;
  }
});

// Serialized method, must be called within each res.json()
UserSchema.methods.serialize = function() {
  return {
    id: this._id,
    username: this.username,
    firstName: this.firstName || '',
    lastName: this.lastName || ''
  };
};

UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);

module.exports = { User };
