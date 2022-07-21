const { Pool } = require('pg');


// Setup connection
const dbPool = new Pool({
    database: 'blog_project',
    port: 5432,
    user: 'postgres',
    password: '515352'
})

module.exports = dbPool