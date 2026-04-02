import { validateRedirectUrl } from '../src/lib/security/redirect-validator';

const testCases = [
    { input: '/client', expected: '/client', desc: 'Valid relative path' },
    { input: 'https://evil.com', expected: '/client', desc: 'External domain (blocked)' },
    { input: '//evil.com', expected: '/client', desc: 'Protocol-relative (blocked)' },
    { input: 'javascript:alert(1)', expected: '/client', desc: 'XSS protocol (blocked)' },
    { input: '  /admin  ', expected: '/admin', desc: 'Trim whitespace' },
    { input: 'http://localhost/test', expected: '/test', desc: 'Allowed host (localhost)' },
    { input: null, expected: '/client', desc: 'Null input' },
];

console.log('--- Redirect Validator Security Test ---');
let passed = 0;

testCases.forEach(tc => {
    const result = validateRedirectUrl(tc.input as any);
    const success = result === tc.expected;
    console.log(`[${success ? 'PASS' : 'FAIL'}] ${tc.desc}`);
    console.log(`  Input: ${tc.input}`);
    console.log(`  Output: ${result}`);
    if (success) passed++;
});

console.log(`\nFinal: ${passed}/${testCases.length} passed.`);
if (passed === testCases.length) {
    process.exit(0);
} else {
    process.exit(1);
}
