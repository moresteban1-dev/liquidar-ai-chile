import { NextResponse } from 'next/server';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { getContainer } from '@/infrastructure/di/Container';
import { SendQuotationToClientHandler } from '@/core/application/handlers/SendQuotationToClientHandler';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';

const SendToClientSchema = z.object({
  adminNotes: z.string().optional()
});

/**
 * POST /api/quotations/[id]/send-to-client
 * 
 * Admin sends quotation to client
 * Requires: admin role
 */
export const POST = withAuth(async (request, user, params) => {
    try {
      const id = params?.id;
      if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

      const body = await request.json().catch(() => ({}));
      SendToClientSchema.parse(body);

      // Forensic Remediation: Sanitize input to prevent XSS
      const sanitizedNotes = body.adminNotes 
        ? sanitizeHtml(body.adminNotes, {
            allowedTags: [],
            allowedAttributes: {}
          })
        : undefined;

      const container = await getContainer();
      const handler = await container.resolve<SendQuotationToClientHandler>(
        'SendQuotationToClientHandler'
      );

      const result = await handler.execute({
        commandName: 'SendQuotationToClient',
        quotationId: id,
        adminId: user.id,
        adminNotes: sanitizedNotes
      });

      if (result.isFailure()) {
        const error = result.getError();
        return NextResponse.json(
          { error: typeof error === 'string' ? error : (error as any).message },
          { status: 400 }
        );
      }

      const quotation = result.value!;

      return NextResponse.json({
        id: quotation.quotationId.toString(),
        status: quotation.status,
        sentToClientAt: quotation.props.sentToClientAt?.toISOString(),
        pricing: quotation.pricing.toAdminView(),
        message: 'Quotation sent to client successfully'
      });

    } catch (error) {
      console.error('Error in send-to-client:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }, { roles: [UserRole.ADMIN] }
);
