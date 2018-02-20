'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.seeder = undefined;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _csvParse = require('csv-parse');

var _csvParse2 = _interopRequireDefault(_csvParse);

var _iconvLite = require('iconv-lite');

var _iconvLite2 = _interopRequireDefault(_iconvLite);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _events = require('events');

var _bluebird = require('bluebird');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const seeder = exports.seeder = {
  seed(options) {
    return (knex, Promise) => {
      return new Promise((resolve, reject) => {
        KnexSeeder.fromKnexClient(knex).on('end', resolve).on('error', reject).generate(options);
      });
    };
  }
};

exports.default = seeder.seed;


class KnexSeeder extends _events.EventEmitter {

  constructor(knex) {
    super();
    this.opts = {};
    this.knex = knex;
    this.headers = [];
    this.records = [];
    this.parser = null;
    this.queue = null;
    this.results = [];
    this.onReadable = this.onReadable.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.onSucceeded = this.onSucceeded.bind(this);
    this.onFailed = this.onFailed.bind(this);
  }

  static fromKnexClient(knex) {
    return new KnexSeeder(knex);
  }

  mergeOptions(options) {
    let opts = options || {};
    let defaults = {
      file: null,
      table: null,
      encoding: 'utf8',
      recordsPerQuery: 100,
      parser: {
        delimiter: ',',
        quote: '"',
        escape: '\\',
        skip_empty_lines: true,
        auto_parse: true
      }
    };

    return _lodash2.default.merge({}, defaults, opts);
  }

  generate(options) {
    this.opts = this.mergeOptions(options);

    this.parser = (0, _csvParse2.default)(this.opts.parser);
    this.parser.on('readable', this.onReadable);
    this.parser.on('end', this.onEnd);
    this.parser.on('error', this.onFailed);

    this.queue = _bluebird.Promise.bind(this).then(this.createCleanUpQueue());

    this.csv = _fs2.default.createReadStream(this.opts.file);
    this.csv.pipe(_iconvLite2.default.decodeStream(this.opts.encoding)).pipe(this.parser);
  }

  onReadable() {
    let obj = {};
    let record = this.parser.read();

    if (record === null) {
      return;
    }

    if (this.parser.count <= 1) {
      this.headers = record;
    } else {
      this.records.push(this.createObjectFrom(record));
    }

    if (this.records.length < this.opts.recordsPerQuery) {
      return;
    }

    this.queue = this.queue.then(this.createBulkInsertQueue());
  }
  onEnd() {
    if (this.records.length > 0) {
      this.queue = this.queue.then(this.createBulkInsertQueue());
    }
    this.queue.then(() => {
      return this.emit('end', this.results);
    }).catch(this.onFailed);
  }
  createCleanUpQueue() {
    return () => {
      return this.knex(this.opts.table).del().then(this.onSucceeded).catch(this.onFailed);
    };
  }
  createBulkInsertQueue() {
    const records = this.records.splice(0, this.opts.recordsPerQuery);

    return () => {
      return this.knex(this.opts.table).insert(records).then(this.onSucceeded).catch(this.onFailed);
    };
  }
  createObjectFrom(record) {
    let obj = {};

    this.headers.forEach((column, i) => {
      let val = record[i];

      if (typeof val === 'string' && val.toLowerCase() === 'null') {
        val = null;
      }
      obj[column] = val;
    });
    return obj;
  }
  onSucceeded(res) {
    this.results.push(res);
  }
  onFailed(err) {
    this.csv.unpipe();
    this.emit('error', err);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zZWVkZXIuanMiXSwibmFtZXMiOlsic2VlZGVyIiwic2VlZCIsIm9wdGlvbnMiLCJrbmV4IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJLbmV4U2VlZGVyIiwiZnJvbUtuZXhDbGllbnQiLCJvbiIsImdlbmVyYXRlIiwiY29uc3RydWN0b3IiLCJvcHRzIiwiaGVhZGVycyIsInJlY29yZHMiLCJwYXJzZXIiLCJxdWV1ZSIsInJlc3VsdHMiLCJvblJlYWRhYmxlIiwiYmluZCIsIm9uRW5kIiwib25TdWNjZWVkZWQiLCJvbkZhaWxlZCIsIm1lcmdlT3B0aW9ucyIsImRlZmF1bHRzIiwiZmlsZSIsInRhYmxlIiwiZW5jb2RpbmciLCJyZWNvcmRzUGVyUXVlcnkiLCJkZWxpbWl0ZXIiLCJxdW90ZSIsImVzY2FwZSIsInNraXBfZW1wdHlfbGluZXMiLCJhdXRvX3BhcnNlIiwibWVyZ2UiLCJ0aGVuIiwiY3JlYXRlQ2xlYW5VcFF1ZXVlIiwiY3N2IiwiY3JlYXRlUmVhZFN0cmVhbSIsInBpcGUiLCJkZWNvZGVTdHJlYW0iLCJvYmoiLCJyZWNvcmQiLCJyZWFkIiwiY291bnQiLCJwdXNoIiwiY3JlYXRlT2JqZWN0RnJvbSIsImxlbmd0aCIsImNyZWF0ZUJ1bGtJbnNlcnRRdWV1ZSIsImVtaXQiLCJjYXRjaCIsImRlbCIsInNwbGljZSIsImluc2VydCIsImZvckVhY2giLCJjb2x1bW4iLCJpIiwidmFsIiwidG9Mb3dlckNhc2UiLCJyZXMiLCJlcnIiLCJ1bnBpcGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBRU8sTUFBTUEsMEJBQVM7QUFDcEJDLE9BQUtDLE9BQUwsRUFBYztBQUNaLFdBQU8sQ0FBQ0MsSUFBRCxFQUFPQyxPQUFQLEtBQW1CO0FBQ3hCLGFBQU8sSUFBSUEsT0FBSixDQUFZLENBQUNDLE9BQUQsRUFBVUMsTUFBVixLQUFxQjtBQUN0Q0MsbUJBQVdD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LENBQ0d2QyxPQURILEVBRUpxQixJQUZJLENBRUMsS0FBS2QsV0FGTixFQUdKNkIsS0FISSxDQUdFLEtBQUs1QixRQUhQLENBQVA7QUFJRCxLQUxEO0FBTUQ7QUFDRHdCLG1CQUFpQkosTUFBakIsRUFBeUI7QUFDdkIsUUFBSUQsTUFBTSxFQUFWOztBQUVBLFNBQUs1QixPQUFMLENBQWF5QyxPQUFiLENBQXFCLENBQUNDLE1BQUQsRUFBU0MsQ0FBVCxLQUFlO0FBQ2xDLFVBQUlDLE1BQU1mLE9BQU9jLENBQVAsQ0FBVjs7QUFFQSxVQUFJLE9BQU9DLEdBQVAsS0FBZSxRQUFmLElBQTJCQSxJQUFJQyxXQUFKLE9BQXNCLE1BQXJELEVBQTZEO0FBQzNERCxjQUFNLElBQU47QUFDRDtBQUNEaEIsVUFBSWMsTUFBSixJQUFjRSxHQUFkO0FBQ0QsS0FQRDtBQVFBLFdBQU9oQixHQUFQO0FBQ0Q7QUFDRHBCLGNBQVlzQyxHQUFaLEVBQWlCO0FBQ2YsU0FBSzFDLE9BQUwsQ0FBYTRCLElBQWIsQ0FBa0JjLEdBQWxCO0FBQ0Q7QUFDRHJDLFdBQVNzQyxHQUFULEVBQWM7QUFDWixTQUFLdkIsR0FBTCxDQUFTd0IsTUFBVDtBQUNBLFNBQUtaLElBQUwsQ0FBVSxPQUFWLEVBQW1CVyxHQUFuQjtBQUNEO0FBdEhtQyIsImZpbGUiOiJzZWVkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhcnNlIGZyb20gJ2Nzdi1wYXJzZSc7XG5pbXBvcnQgaWNvbnYgZnJvbSAnaWNvbnYtbGl0ZSc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7IFByb21pc2UgfSBmcm9tICdibHVlYmlyZCc7XG5cbmV4cG9ydCBjb25zdCBzZWVkZXIgPSB7XG4gIHNlZWQob3B0aW9ucykge1xuICAgIHJldHVybiAoa25leCwgUHJvbWlzZSkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgS25leFNlZWRlci5mcm9tS25leENsaWVudChrbmV4KVxuICAgICAgICAgIC5vbignZW5kJywgcmVzb2x2ZSlcbiAgICAgICAgICAub24oJ2Vycm9yJywgcmVqZWN0KVxuICAgICAgICAgIC5nZW5lcmF0ZShvcHRpb25zKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IHNlZWRlci5zZWVkO1xuXG5jbGFzcyBLbmV4U2VlZGVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuICBjb25zdHJ1Y3RvcihrbmV4KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm9wdHMgPSB7fTtcbiAgICB0aGlzLmtuZXggPSBrbmV4O1xuICAgIHRoaXMuaGVhZGVycyA9IFtdO1xuICAgIHRoaXMucmVjb3JkcyA9IFtdO1xuICAgIHRoaXMucGFyc2VyID0gbnVsbDtcbiAgICB0aGlzLnF1ZXVlID0gbnVsbDtcbiAgICB0aGlzLnJlc3VsdHMgPSBbXTtcbiAgICB0aGlzLm9uUmVhZGFibGUgPSB0aGlzLm9uUmVhZGFibGUuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uRW5kID0gdGhpcy5vbkVuZC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub25TdWNjZWVkZWQgPSB0aGlzLm9uU3VjY2VlZGVkLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbkZhaWxlZCA9IHRoaXMub25GYWlsZWQuYmluZCh0aGlzKTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tS25leENsaWVudChrbmV4KSB7XG4gICAgcmV0dXJuIG5ldyBLbmV4U2VlZGVyKGtuZXgpO1xuICB9XG5cbiAgbWVyZ2VPcHRpb25zKG9wdGlvbnMpIHtcbiAgICBsZXQgb3B0cyA9IG9wdGlvbnMgfHwge307XG4gICAgbGV0IGRlZmF1bHRzID0ge1xuICAgICAgZmlsZTogbnVsbCxcbiAgICAgIHRhYmxlOiBudWxsLFxuICAgICAgZW5jb2Rpbmc6ICd1dGY4JyxcbiAgICAgIHJlY29yZHNQZXJRdWVyeTogMTAwLFxuICAgICAgcGFyc2VyOiB7XG4gICAgICAgIGRlbGltaXRlcjogJywnLFxuICAgICAgICBxdW90ZTogJ1wiJyxcbiAgICAgICAgZXNjYXBlOiAnXFxcXCcsXG4gICAgICAgIHNraXBfZW1wdHlfbGluZXM6IHRydWUsXG4gICAgICAgIGF1dG9fcGFyc2U6IHRydWVcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIF8ubWVyZ2Uoe30sIGRlZmF1bHRzLCBvcHRzKTtcbiAgfVxuXG4gIGdlbmVyYXRlKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdHMgPSB0aGlzLm1lcmdlT3B0aW9ucyhvcHRpb25zKTtcblxuICAgIHRoaXMucGFyc2VyID0gcGFyc2UodGhpcy5vcHRzLnBhcnNlcik7XG4gICAgdGhpcy5wYXJzZXIub24oJ3JlYWRhYmxlJywgdGhpcy5vblJlYWRhYmxlKTtcbiAgICB0aGlzLnBhcnNlci5vbignZW5kJywgdGhpcy5vbkVuZCk7XG4gICAgdGhpcy5wYXJzZXIub24oJ2Vycm9yJywgdGhpcy5vbkZhaWxlZCk7XG5cbiAgICB0aGlzLnF1ZXVlID0gUHJvbWlzZS5iaW5kKHRoaXMpLnRoZW4oIHRoaXMuY3JlYXRlQ2xlYW5VcFF1ZXVlKCkgKTtcblxuICAgIHRoaXMuY3N2ID0gZnMuY3JlYXRlUmVhZFN0cmVhbSh0aGlzLm9wdHMuZmlsZSk7XG4gICAgdGhpcy5jc3YucGlwZSggaWNvbnYuZGVjb2RlU3RyZWFtKHRoaXMub3B0cy5lbmNvZGluZykgKS5waXBlKHRoaXMucGFyc2VyKTtcbiAgfVxuXG4gIG9uUmVhZGFibGUoKSB7XG4gICAgbGV0IG9iaiA9IHt9O1xuICAgIGxldCByZWNvcmQgPSB0aGlzLnBhcnNlci5yZWFkKCk7XG5cbiAgICBpZiAocmVjb3JkID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucGFyc2VyLmNvdW50IDw9IDEpIHtcbiAgICAgIHRoaXMuaGVhZGVycyA9IHJlY29yZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZWNvcmRzLnB1c2goIHRoaXMuY3JlYXRlT2JqZWN0RnJvbShyZWNvcmQpICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucmVjb3Jkcy5sZW5ndGggPCB0aGlzLm9wdHMucmVjb3Jkc1BlclF1ZXJ5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5xdWV1ZSA9IHRoaXMucXVldWUudGhlbiggdGhpcy5jcmVhdGVCdWxrSW5zZXJ0UXVldWUoKSApO1xuICB9XG4gIG9uRW5kKCkge1xuICAgIGlmICh0aGlzLnJlY29yZHMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5xdWV1ZSA9IHRoaXMucXVldWUudGhlbiggdGhpcy5jcmVhdGVCdWxrSW5zZXJ0UXVldWUoKSApO1xuICAgIH1cbiAgICB0aGlzLnF1ZXVlLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuZW1pdCgnZW5kJywgdGhpcy5yZXN1bHRzKTtcbiAgICB9KS5jYXRjaCh0aGlzLm9uRmFpbGVkKTtcbiAgfVxuICBjcmVhdGVDbGVhblVwUXVldWUoKSB7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLmtuZXgodGhpcy5vcHRzLnRhYmxlKS5kZWwoKVxuICAgICAgICAudGhlbih0aGlzLm9uU3VjY2VlZGVkKVxuICAgICAgICAuY2F0Y2godGhpcy5vbkZhaWxlZCk7XG4gICAgfTtcbiAgfVxuICBjcmVhdGVCdWxrSW5zZXJ0UXVldWUoKSB7XG4gICAgY29uc3QgcmVjb3JkcyA9IHRoaXMucmVjb3Jkcy5zcGxpY2UoMCwgdGhpcy5vcHRzLnJlY29yZHNQZXJRdWVyeSk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMua25leCh0aGlzLm9wdHMudGFibGUpXG4gICAgICAgIC5pbnNlcnQocmVjb3JkcylcbiAgICAgICAgLnRoZW4odGhpcy5vblN1Y2NlZWRlZClcbiAgICAgICAgLmNhdGNoKHRoaXMub25GYWlsZWQpO1xuICAgIH07XG4gIH1cbiAgY3JlYXRlT2JqZWN0RnJvbShyZWNvcmQpIHtcbiAgICBsZXQgb2JqID0ge307XG5cbiAgICB0aGlzLmhlYWRlcnMuZm9yRWFjaCgoY29sdW1uLCBpKSA9PiB7XG4gICAgICBsZXQgdmFsID0gcmVjb3JkW2ldO1xuXG4gICAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgJiYgdmFsLnRvTG93ZXJDYXNlKCkgPT09ICdudWxsJykge1xuICAgICAgICB2YWwgPSBudWxsO1xuICAgICAgfVxuICAgICAgb2JqW2NvbHVtbl0gPSB2YWw7XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuICBvblN1Y2NlZWRlZChyZXMpIHtcbiAgICB0aGlzLnJlc3VsdHMucHVzaChyZXMpO1xuICB9XG4gIG9uRmFpbGVkKGVycikge1xuICAgIHRoaXMuY3N2LnVucGlwZSgpO1xuICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlcnIpO1xuICB9XG59XG4iXX0=