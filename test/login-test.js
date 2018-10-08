'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { app } = require('../server.js');
const { TEST_DATABASE_URL, JWT_SECRET } = require('../config.js');
const { User } = require('../models/user.js');

chai.use(chaiHttp);
const expect = chai.expect;

// Login test
describe('Acceptable Losses Login', function() {

  before(function() {
    return mongoose
      .connect(TEST_DATABASE_URL)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  // user info for testing
  const _id = '999999999999999999999999';
  const firstName = 'John';
  const lastName = 'Smith';
  const username = 'jsmith@example.com';
  const password = 'testpassword';

  beforeEach(function() {
    return User
      .hashPassword(password)
      .then(hash => User.create({
        _id,
        firstName,
        lastName,
        username,
        password: hash
      }));
  });

  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('/api/login', function() {
  
    describe('POST', function() {

      it('Should return a valid jwt token when provided valid login credentials', function() {
        return chai
          .request(app)
          .post('/api/auth/login')
          .send({ username, password })
          .then(res => {
            const token = res.body.authToken;
            const payload = jwt.verify(token, JWT_SECRET, {algorithm: ['HS256']});
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body.authToken).to.be.a('string');
            expect(payload.user.id).to.equal(_id);
            expect(payload.user.firstName).to.equal(firstName);
            expect(payload.user.lastName).to.equal(lastName);
            expect(payload.user.username).to.equal(username);
          });
      });

      it('Should reject a login when username is invalid', function() {
        return chai
          .request(app)
          .post('/api/auth/login')
          .send({ username: 'invalidUser@example.com', password })
          .then(res => {
            expect(res).to.have.status(401);
          });
      });

      it('Should reject a login when username is an empty string', function() {
        return chai
          .request(app)
          .post('/api/auth/login')
          .send({ username: '', password })
          .then(res => {
            expect(res).to.have.status(400);
          });
      });

      it('Should reject a login when username is missing', function() {
        return chai
          .request(app)
          .post('/api/auth/login')
          .send({ password })
          .then(res => {
            expect(res).to.have.status(400);
          });
      });

      it('Should reject a login when password is invalid', function() {
        return chai
          .request(app)
          .post('/api/auth/login')
          .send({ username, password: 'invalidPassword' })
          .then(res => {
            expect(res).to.have.status(401);
          });
      });

      it('Should reject a login when password is an empty string', function() {
        return chai
          .request(app)
          .post('/api/auth/login')
          .send({ username, password: '' })
          .then(res => {
            expect(res).to.have.status(400);
          });
      });

      it('Should reject a login when username is missing', function() {
        return chai
          .request(app)
          .post('/api/auth/login')
          .send({ password })
          .then(res => {
            expect(res).to.have.status(400);
          });
      });

      it('Should reject a login when credentials are missing', function() {
        return chai
          .request(app)
          .post('/api/auth/login')
          .send({})
          .then(res => {
            expect(res).to.have.status(400);
          });
      });

    });
  
  });

});
