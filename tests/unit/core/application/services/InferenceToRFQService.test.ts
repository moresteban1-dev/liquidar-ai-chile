import { InferenceToRFQService } from '@/core/application/services/InferenceToRFQService';
import { InferenceEngine } from '@/core/domain/event-intelligence/engine/InferenceEngine';
import { ProductMatcher } from '@/core/domain/event-intelligence/ProductMatcher';
import { KnowledgeGraphRepository } from '@/core/domain/event-intelligence/KnowledgeGraphRepository';
import { IQuoteSessionRepository } from '@/core/application/ports/repositories/IQuoteSessionRepository';
import { Result } from '@/core/shared/Result';
import { InferredNeed, ConfigurationSession } from '@/core/domain/event-intelligence/types';
import { Logger } from '@/core/application/ports/Logger';

describe('InferenceToRFQService', () => {
  let service: InferenceToRFQService;
  let mockEngine: any;
  let mockMatcher: any;
  let mockConfigRepo: any;
  let mockQuoteRepo: any;
  let mockLogger: any;

  beforeEach(() => {
    mockEngine = {
      runInference: vi.fn()
    };
    mockMatcher = {
      findBestMatches: vi.fn()
    };
    mockConfigRepo = {
      getConfigurationSession: vi.fn()
    };
    mockQuoteRepo = {
      save: vi.fn(),
      addItems: vi.fn()
    };
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    };

    service = new InferenceToRFQService(
      mockEngine as unknown as InferenceEngine,
      mockMatcher as unknown as ProductMatcher,
      mockConfigRepo as unknown as KnowledgeGraphRepository,
      mockQuoteRepo as unknown as IQuoteSessionRepository,
      mockLogger as unknown as Logger
    );
  });

  it('debe convertir una sesión de configuración en un RFQ exitosamente', async () => {
    // 1. Setup Data
    const sessionId = 'session-123';
    const clientData = {
      name: 'Esteban Test',
      email: 'esteban@test.com',
      phone: '123456789'
    };

    const mockConfig: ConfigurationSession = {
      id: sessionId,
      clientId: null,
      baseProfile: {
        eventTypeId: 'event-type-1',
        attendees: 100,
        durationHours: 5
      },
      inferredGraph: [],
      status: 'IN_PROGRESS',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockNeeds: InferredNeed[] = [
      { 
        nodeCode: 'SOUND_BASIC', 
        nodeName: 'Sonido Básico', 
        quantityInferred: 1, 
        isEssential: true,
        reasoning: [],
        score: 1,
        scalingRulesApplied: []
      }
    ];

    const mockCatalogItem = { id: 'item-1', name: 'Bose L1' };

    // 2. Setup Mocks
    mockConfigRepo.getConfigurationSession.mockResolvedValue(Result.ok(mockConfig));
    mockEngine.runInference.mockResolvedValue(Result.ok(mockNeeds));
    mockQuoteRepo.save.mockResolvedValue(Result.ok('quote-id-789'));
    mockMatcher.findBestMatches.mockResolvedValue([mockCatalogItem]);
    mockQuoteRepo.addItems.mockResolvedValue(Result.ok(undefined));

    // 3. Execute
    const result = await service.convertToRFQ(sessionId, clientData);

    // 4. Verify
    expect(result.isSuccess()).toBe(true);
    expect(result.getValue()).toBe('quote-id-789');
    expect(mockEngine.runInference).toHaveBeenCalledWith(mockConfig.baseProfile);
    expect(mockMatcher.findBestMatches).toHaveBeenCalledWith(mockNeeds[0]);
    expect(mockQuoteRepo.addItems).toHaveBeenCalledWith('quote-id-789', expect.arrayContaining([
      expect.objectContaining({ catalogItemId: 'item-1' })
    ]));
  });

  it('debe crear un ítem custom si no se encuentra match en el catálogo', async () => {
     // 1. Setup
     const sessionId = 'session-123';
     const clientData = { name: 'Esteban', email: 'e@e.com', phone: '1' };
     const mockConfig = { id: sessionId, baseProfile: { attendees: 10, durationHours: 1 } };
     const mockNeeds = [{ nodeCode: 'NOT_IN_CATALOG', nodeName: 'Fantasma', quantityInferred: 2 }];

     mockConfigRepo.getConfigurationSession.mockResolvedValue(Result.ok(mockConfig));
     mockEngine.runInference.mockResolvedValue(Result.ok(mockNeeds));
     mockQuoteRepo.save.mockResolvedValue(Result.ok('quote-id-999'));
     mockMatcher.findBestMatches.mockResolvedValue([]); // No matches
     mockQuoteRepo.addItems.mockResolvedValue(Result.ok(undefined));

     // 2. Execute
     const result = await service.convertToRFQ(sessionId, clientData);

     // 3. Verify
     expect(result.isSuccess()).toBe(true);
     expect(mockQuoteRepo.addItems).toHaveBeenCalledWith('quote-id-999', expect.arrayContaining([
       expect.objectContaining({ isCustom: true, customName: expect.stringContaining('Fantasma') })
     ]));
  });
});

