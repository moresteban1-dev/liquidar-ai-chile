import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local first, then fallback to .env
const localEnvPath = path.resolve(__dirname, '../.env.local');
const defaultEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(localEnvPath)) {
    console.log('📝 Loading variables from .env.local');
    dotenv.config({ path: localEnvPath });
} else {
    console.log('📝 Loading variables from .env');
    dotenv.config({ path: defaultEnvPath });
}

async function runMigration() {
    console.log('🔗 Connecting to Database...');
    const connectionString = process.env['DATABASE_URL'];

    if (!connectionString) {
        console.error('❌ Error: DATABASE_URL not found in environment');
        process.exit(1);
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260530_add_special_instructions_to_orders.sql');
        console.log(`📂 Reading migration file: ${migrationPath}`);

        if (!fs.existsSync(migrationPath)) {
            throw new Error('Migration file not found');
        }

        const sql = fs.readFileSync(migrationPath, 'utf-8');
        console.log('🚀 Executing SQL...');

        await client.query(sql);
        console.log('✨ Migration applied successfully!');
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('❌ Migration Failed:', err.message);
        }
    } finally {
        await client.end();
        console.log('👋 Connection closed.');
    }
}

runMigration();
