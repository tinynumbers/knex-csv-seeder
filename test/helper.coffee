global.seeder = require('../lib/seeder').default
global.Promise = require 'bluebird'
global.assert = require 'power-assert'
global.knex = require('knex')
  client: 'sqlite3'
  connection:
    filename: ':memory:'
  useNullAsDefault: true
