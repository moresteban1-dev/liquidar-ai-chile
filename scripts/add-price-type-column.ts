import { Client } from 'pg';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Load .env.local fallback
const envLocalPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envLocalPath });

async function addColumn() {
    console.log('🔗 Connecting to Database...');
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ Error: DATABASE_URL not found in env');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        // Alter table query
        const sql = `
            ALTER TABLE public.catalog_items 
            ADD COLUMN IF NOT EXISTS price_type price_type DEFAULT 'COTIZABLE';
        `;

        console.log('🚀 Altering catalog_items table to add price_type column...');
        await client.query(sql);
        console.log('✨ Column added successfully!');

        // Check columns to verify
        const checkSql = `
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'catalog_items' AND column_name = 'price_type';
        `;
        const res = await client.query(checkSql);
        console.log('Verification Result:', res.rows);

    } catch (err: any) {
        console.error('❌ Alter table failed:', err.message);
    } finally {
        await client.end();
        console.log('👋 Connection closed.');
    }
}

addColumn();
