import { IQuotationRepository as QuotationRepository } from '@app/ports/IQuotationRepository';
import { ICatalogRepository as CatalogRepository } from '@app/ports/ICatalogRepository';
import { AIBrokerPort } from '@app/ports/AIBrokerPort';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { QuotationProviderItem } from '@core/domain/aggregates/quotation/QuotationProviderItem';
import { QuotationClientItem } from '@core/domain/aggregates/quotation/QuotationClientItem';
import { Money } from '@core/domain/value-objects/Money';
import { ICommand } from '@core/shared/ICommand';
import { ICommandHandler } from '@core/shared/ICommandHandler';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { QuotationRequestedItem } from '@core/domain/aggregates/quotation/QuotationRequestedItem';

/**
 * Command to trigger the AI-driven catalog matching process for a quotation.
 */
export class AutoMatchProviderItemsCommand implements ICommand {
    readonly commandName = 'AutoMatchProviderItemsCommand';
    constructor(public readonly quotationId: string) { }
}

/**
 * Handler for AutoMatchProviderItemsCommand.
 */
export class AutoMatchHandler implements ICommandHandler<AutoMatchProviderItemsCommand, void> {
    constructor(
        private quotationRepository: QuotationRepository,
        private catalogRepository: CatalogRepository,
        private aiBroker: AIBrokerPort
    ) { }

    async handle(command: AutoMatchProviderItemsCommand): Promise<Result<void, AppError>> {
        const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId));
        if (quotationRes.isFailure()) return fail(AppError.from(quotationRes.getError()));

        const quotation = quotationRes.getValue();
        if (!quotation) return fail(AppError.notFound('Quotation', command.quotationId));

        // 2. Fetch Catalog Context
        const catalogItemsR = await this.catalogRepository.getItems({ statusFilter: 'active' });
        if (catalogItemsR.isFailure()) return fail(AppError.from(catalogItemsR.getError()));

        const catalogItems = catalogItemsR.getValue();
        const simplifiedCatalog = catalogItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: (item as any).description || null,
            category: (item as any).categoryName || null,
            price: (item as any).priceReferenceMin || null
        }));

        // 3. Execute AI Broker Flow
        const matchResult = await this.aiBroker.matchServicesWithCatalog(
            quotation.brief || "",
            quotation.requestedItems.map((i: QuotationRequestedItem, index: number) => ({
                id: `req-${index}`,
                name: i.itemName,
                qty: i.quantity
            })),
            simplifiedCatalog as any
        );

        if (matchResult.isFailure()) return fail(AppError.from(matchResult.getError()));

        // 4. Transform AI Output
        const providerItems: QuotationProviderItem[] = [];
        const clientItems: QuotationClientItem[] = [];

        for (const match of matchResult.getValue().matches) {
            const pPriceRes = Money.create(match.providerProposal.unitPriceNet);
            const cPriceRes = Money.create(match.clientProposal.unitPriceNet);
            if (pPriceRes.isFailure() || cPriceRes.isFailure()) continue;

            const pItemResult = QuotationProviderItem.create(
                match.providerProposal.category,
                match.providerProposal.concept,
                pPriceRes.getValue(),
                match.providerProposal.quantity
            );
            const cItemResult = QuotationClientItem.create(
                match.clientProposal.description,
                cPriceRes.getValue(),
                match.clientProposal.quantity
            );

            if (pItemResult.isSuccess() && cItemResult.isSuccess()) {
                providerItems.push(pItemResult.getValue());
                clientItems.push(cItemResult.getValue());
            }
        }

        // 5. Apply and Save
        const applyRes = quotation.applyAISuggestions(providerItems, clientItems);
        if (applyRes.isFailure()) return fail(AppError.businessRule(applyRes.getError() as string));

        await this.quotationRepository.save(quotation);
        return ok(undefined);
    }
}
