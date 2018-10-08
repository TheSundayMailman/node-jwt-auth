'use strict';

// Clear the console before each run
// process.stdout.write('\x1Bc\n');

const chai = require('chai');
const chaiHttp = require('chai-http');

const { app } = require('../server.js');

const expect = chai.expect;
chai.use(chaiHttp);

// Environment check
describe('Environment', function() {
  it('NODE_ENV should be "test"', function() {
    expect(process.env.NODE_ENV).to.equal('test');
  });
});

// Express setup
describe('Basic Express setup', function() {

  describe('404 handler', function() {
    it('should respond with 404 when given a bad path', function() {
      return chai
        .request(app)
        .get('/bad/path')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });

});
