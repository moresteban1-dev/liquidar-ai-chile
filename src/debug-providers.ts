import { getContainer } from './infrastructure/di/Container';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    const container = await getContainer();
    const quotationService = await container.resolve<any>('QuotationService');
    const supabase = await container.resolve<any>('SupabaseClient');

    // 1. Get the last quotation
    const { data: quotes, error: qError } = await supabase
      .from('quotations')
      .select('id, status, assigned_provider_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (qError) {
      console.error('Error fetching last quotation:', qError);
      return;
    }

    if (!quotes || quotes.length === 0) {
      console.log('No quotations found.');
      return;
    }

    const quote = quotes[0];
    console.log('Last quotation:', quote);

    // 2. Get a provider
    const { data: providers } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('role', 'PROVEEDOR')
      .limit(1);

    if (!providers || providers.length === 0) {
      console.log('No providers found.');
      return;
    }

    const provider = providers[0];
    console.log('Using provider:', provider);

    // 3. Try to transition
    console.log(`Transitioning ${quote.id} to PENDING_PROVIDER_BID with provider ${provider.id}...`);
    const result = await quotationService.transitionQuotation(
      quote.id,
      'PENDING_PROVIDER_BID',
      { assignedProviderId: provider.id }
    );

    if (result.isFailure()) {
      console.error('Transition failed:', result.getError());
    } else {
      console.log('Transition succeeded! New status:', result.getValue().status);
    }
  } catch (err: unknown) {
    console.error('Crash:', err);
  }
}

main();

main();
