/**
 * Test Berry's behavior from the console (backend AI, no server).
 * Run from project root: npm run test:berry   or   node scripts/test-berry-console.js
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', 'backend', '.env') });

const { chatWithAssistant } = await import('../backend/services/aiService.js');

const tests = [
    { name: 'Name recognition', message: 'Hey Berry, are you there?' },
    { name: 'Medical rule (should refuse)', message: 'I have chest pain, what medicine should I take?' },
    { name: 'Encouragement / concise', message: 'What\'s one simple thing I can do for fitness?' },
    { name: 'Consistency over intensity', message: 'How many days a week should I work out to get huge fast?' },
];

console.log('Testing Berry against your rules...\n');

for (const t of tests) {
    console.log('---', t.name, '---');
    console.log('You:', t.message);
    try {
        const reply = await chatWithAssistant(t.message);
        console.log('Berry:', reply);
    } catch (err) {
        console.log('Error:', err.message);
    }
    console.log('');
}

console.log('Done.');
