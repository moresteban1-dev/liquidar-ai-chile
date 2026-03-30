
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../src/lib/logger';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    logger.error('❌ Missing environment variables. Make sure .env.local exists and contains NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initStorage() {
    const BUCKET_NAME = 'assets';

    logger.info(`🚀 Initializing storage bucket: ${BUCKET_NAME}...`);

    try {
        // 1. Check if bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            logger.error(`Error listing buckets: ${listError.message}`, { error: listError });
            throw new Error(`Error listing buckets: ${listError.message}`);
        }

        const existingBucket = buckets.find(b => b.name === BUCKET_NAME);

        if (existingBucket) {
            logger.info(`✅ Bucket '${BUCKET_NAME}' already exists.`);
        } else {
            logger.info(`Creating bucket '${BUCKET_NAME}'...`);
            const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
            });

            if (createError) {
                logger.error(`Error creating bucket: ${createError.message}`, { error: createError });
                throw new Error(`Error creating bucket: ${createError.message}`);
            }
            logger.info(`✅ Bucket '${BUCKET_NAME}' created successfully.`);
        }

        logger.info('🎉 Storage initialization complete.');

    } catch (error) {
        logger.error('❌ Failed to initialize storage:', { error });
        process.exit(1);
    }
}

initStorage().catch(err => logger.error('Unhandled initialization error', { error: err }));
