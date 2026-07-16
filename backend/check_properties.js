const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'casaya'
});
pool.query('SELECT * FROM properties', (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Found properties count:", res.rows.length);
    console.log(res.rows);
  }
  pool.end();
});
