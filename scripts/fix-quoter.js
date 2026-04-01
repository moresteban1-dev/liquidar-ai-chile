// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
const file = 'src/actions/quotations.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /export async function setMarkupAndApprove[\s\S]*?catch \(error: unknown\) \{[\s\S]*?return \{ success: false, error: message \};\n    \}\n\}/;

const replacement = `export async function setMarkupAndApprove(quotationId: string, adminFee: number, totalClientPrice: number): Promise<ActionResponse> {
    try {
        const { user } = await requireRole('ADMIN');

        const supabase = createServiceRoleClient();
        const { error: updateError } = await supabase
            .from('quotations')
            .update({
                admin_fee: adminFee,
                total_client_price: totalClientPrice,
                status: 'AWAITING_CLIENT_PAYMENT',
                public_status: 'COTIZADA',
                updated_at: new Date().toISOString()
            })
            .eq('id', quotationId);

        if (updateError) throw new Error(updateError.message);

        // Security Audit Log (H3)
        const { logSecurityEvent } = await import('@/lib/security/audit');
        await logSecurityEvent('SENSITIVE_DATA_ACCESS', user?.id || 'ADMIN', {
            action: 'setMarkupAndApprove',
            quotationId,
            adminFee,
            totalClientPrice
        });

        await triggerN8nWebhook('quotation-ready', { quotationId, totalClientPrice });

        revalidatePath('/admin/quotations');
        return { success: true };
    } catch (err: unknown) {
        let msg = 'Unknown error';
        if (err instanceof Error) msg = err.message;
        return { success: false, error: msg };
    }
}`;

if (regex.test(content)) {
    fs.writeFileSync(file, content.replace(regex, replacement), 'utf8');
    console.log('Successfully replaced setMarkupAndApprove');
} else {
    console.log('Regex did not match!');
}
