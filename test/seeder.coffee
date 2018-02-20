describe 'seeder', ->
  before ->
    knex.schema.createTable 'users', (table) ->
      console.log 'CREATE TABLE'
      # Always called.
      table.increments('id').primary()
      table.string('name')
      table.string('address')

  after ->
    knex.destroy()

  context 'when 2 lines of csv file', ->
    beforeEach ->
      @timeout 10000

      knex('users').del().then ->
        Promise.all [
          knex('users').insert id: 1, name: 'foo'
          knex('users').insert id: 2, name: 'bar'
        ]

    it 'import the seed', ->
      @timeout 10000

      @seeder = seeder(table: 'users', file: __dirname + '/fixtures/users_utf8.csv', encoding: 'utf8')
      @seeder(knex, Promise).then (res) ->
        deletedCount = res.shift()
        assert.ok deletedCount == 2

        insertedRows = res.shift()
        assert.ok insertedRows.shift() == 2

  context 'when 1 lines of invalid csv file', ->
    beforeEach ->
      @timeout 10000

      knex('users').del().then ->
        Promise.all [
          knex('users').insert id: 1, name: 'foo'
          knex('users').insert id: 2, name: 'bar'
        ]

    afterEach ->
      knex('users').del()

    it 'import the seed failed', ->
      @timeout 10000

      @seeder = seeder(table: 'users', file: __dirname + '/fixtures/invalid_users_utf8.csv', encoding: 'utf8')
      @seeder(knex, Promise).then (res) ->
        throw new Error('succeeded') # name column is not null
      .catch (err) ->
        assert.notEqual err.message, 'succeeded'

  context 'when 300 lines of csv file', ->
    beforeEach ->
      knex('users').del()

    it 'import the seed', ->
      @timeout 60000

      @seeder = seeder(table: 'users', file: __dirname + '/fixtures/300_users_utf8.csv', encoding: 'utf8')
      @seeder(knex, Promise).then (res) ->
        deletedCount = res.shift()
        assert.ok deletedCount == 0

        insertedRows = res.shift()
        assert.ok insertedRows.shift() == 100

        insertedRows = res.shift()
        assert.ok insertedRows.shift() == 200

        insertedRows = res.shift()
        assert.ok insertedRows.shift() == 300

  context 'when 100000 lines of csv file', ->
    beforeEach ->
      knex('users').del()

    it 'import the seed', ->
      @timeout 60000

      @seeder = seeder(table: 'users', file: __dirname + '/fixtures/100000_users_utf8.csv', encoding: 'utf8')
      @seeder(knex, Promise).then (res) ->
        deletedCount = res.shift()
        assert.ok deletedCount == 0

        insertedRows = res.pop()
        assert.ok insertedRows.shift() == 100000
