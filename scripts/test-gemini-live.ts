import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.GOOGLE_GENAI_API_KEY || 'AIzaSyApGyyMy0LSpCt0aRm5lxL0SoIxpi3f-R0';

async function testGemini() {
    console.log('📡 Testing Google Gemini API Key direct HTTP call...');
    console.log(`Key prefix: ${apiKey.substring(0, 7)}...`);
    
    // We query the models endpoint to see what models this key has access to!
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (res.ok) {
            console.log('✅ Success! Available models for this key:');
            const models = data.models || [];
            models.forEach((m: any) => {
                console.log(`  - ${m.name} (supports: ${m.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.error('❌ Error response from Google:', JSON.stringify(data, null, 2));
        }
    } catch (err: any) {
        console.error('💥 Exception during fetch:', err.message);
    }
}

testGemini();
