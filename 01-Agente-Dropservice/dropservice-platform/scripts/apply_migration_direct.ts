import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Handling __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

interface PostgresError extends Error {
    position?: string;
}

async function runMigration() {
    console.log('🔗 Connecting to Database...');

    // Prioritize DATABASE_URL from env
    const connectionString = process.env['DATABASE_URL'];

    if (!connectionString) {
        console.error('❌ Error: DATABASE_URL not found in .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase transaction pooler sometimes
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        const migrationPath = path.resolve(__dirname, '../supabase/migrations/002_rfq_updates.sql');
        console.log(`📂 Reading migration file: ${migrationPath}`);

        if (!fs.existsSync(migrationPath)) {
            throw new Error('Migration file not found');
        }

        const sql = fs.readFileSync(migrationPath, 'utf-8');
        console.log('🚀 Executing SQL...');

        // Execute the entire file as a single query
        await client.query(sql);

        console.log('✨ Migration applied successfully!');



        // ... inside catch block
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('❌ Migration Failed:', err.message);
            const pgErr = err as PostgresError;
            if (pgErr.position) {
                console.error(`   At position: ${pgErr.position}`);
            }
        }
    } finally {
        await client.end();
        console.log('👋 Connection closed.');
    }
}

runMigration();
