// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
const file = 'src/actions/settings.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(error\) \{\s*throw new Error\(`Failed to update settings: \$\{error\.message\}`\);\s*\}/;

const replacement = `if (error) {
        throw new Error(\`Failed to update settings: \${error.message}\`);
    }

    // Security Audit Log (H3)
    try {
        const { getAuthUser } = await import('@/lib/supabase/api');
        const user = await getAuthUser();
        const { logSecurityEvent } = await import('@/lib/security/audit');
        await logSecurityEvent('PLATFORM_CONFIG_CHANGED', user?.id || 'SYSTEM_ADMIN', {
            action: 'updateOrganizationSettings',
            changes: Object.keys(data)
        });
    } catch (e) {
        // Silent catch for audit logger
    }`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('H3: Successfully injected audit log in settings.ts');
} else {
    console.error('H3: target not found in settings.ts');
}
