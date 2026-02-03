/**
 * Interactive chat with Berry from the console (backend AI, no server).
 * Run from project root: npm run chat:berry   or   node Tests/chat-berry.js
 *
 * Type your messages and press Enter. Type 'exit' or 'quit' to end.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', 'backend', '.env') });

const { chatWithAssistant } = await import('../backend/services/aiService.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🍓 Berry Chat - Interactive Console\n');
console.log('Type your message and press Enter. Type "exit" or "quit" to end.\n');
console.log('Try: "Hey Berry, what\'s a good breakfast?"\n');

function askQuestion() {
    rl.question('You: ', async (input) => {
        const message = input.trim();
        
        if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
            console.log('\n👋 Goodbye!');
            rl.close();
            return;
        }
        
        if (!message) {
            askQuestion();
            return;
        }
        
        try {
            process.stdout.write('Berry: ');
            const response = await chatWithAssistant(message);
            console.log(response);
            console.log(''); // blank line
        } catch (error) {
            console.error('Error:', error.message);
            console.log('');
        }
        
        askQuestion();
    });
}

askQuestion();
