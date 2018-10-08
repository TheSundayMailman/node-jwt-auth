'use strict';

const createKnex = require('knex');

const {DATABASE_URL} = require('./config.js');

let knex = null;

function dbConnect(url = DATABASE_URL) {
  knex = createKnex({
    client: 'pg',
    connection: url
  });
}

function dbDisconnect() {
  return knex.destroy();
}

function dbGet() {
  return knex;
}

module.exports = {
  dbConnect,
  dbDisconnect,
  dbGet
};
