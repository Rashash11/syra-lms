// Check actual table names in the database
const { Client } = require('pg');

async function checkTables() {
    const client = new Client({
        host: 'localhost',
        port: 5433,
        database: 'lms_db',
        user: 'lms_user',
        password: 'password'
    });

    try {
        await client.connect();
        console.log('✓ Connected to database\n');

        // List all tables
        const res = await client.query(`
            SELECT table_name, table_schema
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        console.log(`Found ${res.rows.length} tables in public schema:\n`);

        const userTables = res.rows.filter(r => r.table_name.toLowerCase().includes('user'));

        console.log('Tables with "user" in name:');
        userTables.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        console.log('\nAll tables (first 20):');
        res.rows.slice(0, 20).forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        await client.end();
    } catch (error) {
        console.error('Error:', error.message);
        if (client) await client.end();
    }
}

checkTables();
