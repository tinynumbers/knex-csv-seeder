import fs from 'fs';
import parse from 'csv-parse';
import iconv from 'iconv-lite';
import { EventEmitter } from 'events';
import { Promise } from 'bluebird';

export const seeder = {
  seed(options) {
    return (knex, Promise) => {
      return new Promise((resolve, reject) => {
        KnexSeeder.fromKnexClient(knex)
          .on('end', resolve)
          .on('error', reject)
          .generate(options);
      });
    };
  }
};

export default seeder.seed;

class KnexSeeder extends EventEmitter {

  constructor(knex) {
    super();
    this.opts = {};
    this.knex = knex;
    this.headers = [];
    this.records = [];
    this.parser = parse({
      delimiter: ',',
      skip_empty_lines: true,
      auto_parse: true
    });
  }

  static fromKnexClient(knex) {
    return new KnexSeeder(knex);
  }

  mergeOptions(options) {
    let opts = options || {};
    let defaults = {
      file: null,
      table: null,
      encoding: 'utf8'
    };

    for (let k of Object.keys(opts)) {
      defaults[k] = opts[k];
    }

    return defaults;
  }

  generate(options) {
    this.opts = this.mergeOptions(options);
    this.parser.on('readable', this.readable.bind(this) );
    this.parser.on('end', this.end.bind(this) );
    this.parser.on('error', this.error.bind(this) );

    let csv = fs.createReadStream(this.opts.file);
    csv.pipe( iconv.decodeStream(this.opts.encoding) ).pipe(this.parser);
  }

  readable() {
    let obj = {};
    let record = this.parser.read();

    if (record === null) {
      return;
    }

    if (this.parser.count <= 1) {
      this.headers = record;
    } else {
      this.headers.forEach((column, i) => {
        let val = record[i];

        if (typeof val === 'string' && val.toLowerCase() === 'null') {
          val = null;
        }
        obj[column] = val;
      });
      this.records.push(obj);
    }
  }
  end() {
    const queues = [
      this.knex(this.opts.table).del(),
      this.knex(this.opts.table).insert(this.records)
    ];
    this.emit('end', Promise.join.apply(Promise, queues));
  }
  error(err) {
    this.emit('error', err);
  }
}