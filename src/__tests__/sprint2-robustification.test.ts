import { describe, it, expect, vi } from 'vitest';
import { GracefulShutdownManager } from '../infrastructure/server/gracefulShutdown';
import { RedisAuctionCacheAdapter, RedisClientInterface, CachedAuctionData } from '../infrastructure/adapters/cache/RedisAuctionCacheAdapter';
import { AuctionMcpServer } from '../infrastructure/ai/mcp/AuctionMcpServer';
import { AuctionSettlementWorkflow } from '../infrastructure/ai/workflows/AuctionSettlementWorkflow';
import { placeBidAction } from '../presentation/app/actions/bidActions';
import { Auction } from '../domain/entities/Auction';
import { Money } from '../domain/value-objects/Money';
import { Rut } from '../domain/value-objects/Rut';
import { Result } from '../domain/shared/Result';

describe('Sprint 2 Robustification Components (MIT CSAIL Standards)', () => {

  describe('GracefulShutdownManager', () => {
    it('should register resources and shut down cleanly', async () => {
      const shutdownManager = new GracefulShutdownManager({ timeoutMs: 2000 });
      const closeFn = vi.fn().mockResolvedValue(undefined);

      shutdownManager.registerResource({
        name: 'MockBullMQQueue',
        close: closeFn,
      });

      expect(shutdownManager.isShutdownInProgress).toBe(false);
      await shutdownManager.executeShutdown('SIGTERM');
      expect(shutdownManager.isShutdownInProgress).toBe(true);
      expect(closeFn).toHaveBeenCalled();
    });
  });

  describe('RedisAuctionCacheAdapter', () => {
    it('should perform cache-aside read and atomic bid update', async () => {
      const storage = new Map<string, string>();
      const mockRedis: RedisClientInterface = {
        get: vi.fn().mockImplementation(async (key: string) => storage.get(key) || null),
        set: vi.fn().mockImplementation(async (key: string, val: string) => {
          storage.set(key, val);
          return 'OK';
        }),
        del: vi.fn().mockImplementation(async (key: string) => (storage.delete(key) ? 1 : 0)),
        eval: vi.fn().mockResolvedValue(1),
      };

      const cacheAdapter = new RedisAuctionCacheAdapter(mockRedis);

      const initialData: CachedAuctionData = {
        auctionId: 'auction-cached-1',
        currentPriceCLP: 100000,
        minBidIncrementCLP: 10000,
        status: 'ACTIVE',
        endDate: new Date().toISOString(),
        bidCount: 1,
      };

      // Warm up cache
      await cacheAdapter.setAuctionCache(initialData);

      // Read cache
      const fetchResult = await cacheAdapter.getAuctionCache('auction-cached-1');
      expect(fetchResult.isSuccess).toBe(true);
      expect(fetchResult.getValue()?.currentPriceCLP).toBe(100000);

      // Execute atomic bid check
      const atomicResult = await cacheAdapter.executeAtomicBidUpdate('auction-cached-1', '123456785', 120000);
      expect(atomicResult.isSuccess).toBe(true);
      expect(atomicResult.getValue().isAccepted).toBe(true);
      expect(atomicResult.getValue().newCurrentPriceCLP).toBe(120000);
    });
  });

  describe('AuctionMcpServer', () => {
    it('should list available tools and handle tax calculation tool calls', async () => {
      const mcpServer = new AuctionMcpServer();
      const tools = mcpServer.getAvailableTools();

      expect(tools).toContain('calculate_chilean_tax');
      expect(tools).toContain('validate_rut');
      expect(tools).toContain('evaluate_bid_risk');

      // Call Chilean Tax Tool
      const taxResponse = await mcpServer.handleToolCall({
        name: 'calculate_chilean_tax',
        arguments: { amountCLP: 119000, isGross: true },
      });

      expect(taxResponse.success).toBe(true);
      const resData = taxResponse.result as any;
      expect(resData.netCLP).toBe(100000);
      expect(resData.ivaCLP).toBe(19000);
    });
  });

  describe('AuctionSettlementWorkflow (Mastra-style Durable Workflow)', () => {
    it('should start workflow, suspend waiting payment, and resume upon payment notification', () => {
      const startResult = AuctionSettlementWorkflow.start(
        'wf-001',
        'auction-500',
        '12.345.678-5',
        119000
      );

      expect(startResult.isSuccess).toBe(true);
      const workflow = startResult.getValue();

      expect(workflow.getContext.state).toBe('SUSPENDED_WAITING_PAYMENT');
      expect(workflow.getContext.netAmountCLP).toBe(100000);
      expect(workflow.getContext.ivaAmountCLP).toBe(19000);

      // Resume on payment webhook
      const resumeResult = workflow.resumeOnPaymentReceived('TRANSBANK', 'tbk-tx-999');
      expect(resumeResult.isSuccess).toBe(true);
      expect(workflow.getContext.state).toBe('COMPLETED');
      expect(workflow.getContext.transactionId).toBe('tbk-tx-999');
    });
  });

  describe('placeBidAction (Next.js 16 Presentation Controller)', () => {
    it('should process bid through Server Action controller and return ActionResult', async () => {
      const sellerRut = Rut.create('765432103').getValue();
      const now = new Date();
      const auction = Auction.create({
        id: 'auction-act-1',
        sellerRut,
        title: 'Lote Servidores Rack 2U',
        description: 'Servidores de liquidación',
        startingPrice: Money.create(200000).getValue(),
        reservePrice: Money.create(300000).getValue(),
        minBidIncrement: Money.create(20000).getValue(),
        startDate: now,
        endDate: new Date(now.getTime() + 3600000),
      }).getValue();
      auction.activate();

      const mockRepo = {
        findById: vi.fn().mockResolvedValue(Result.ok(auction)),
        save: vi.fn().mockResolvedValue(Result.ok(undefined)),
        updateBid: vi.fn().mockResolvedValue(Result.ok(undefined)),
      };
      const mockQA = {
        evaluateBid: vi.fn().mockResolvedValue(Result.ok({ isApproved: true, riskScore: 0, flaggedForFraud: false })),
      };
      const mockPublisher = {
        publish: vi.fn().mockResolvedValue(Result.ok(undefined)),
        publishBatch: vi.fn().mockResolvedValue(Result.ok(undefined)),
      };

      const actionResult = await placeBidAction(
        {
          auctionId: 'auction-act-1',
          bidderRut: '123456785',
          amountCLP: 250000,
        },
        {
          auctionRepository: mockRepo,
          qaSentinelAgent: mockQA,
          eventPublisher: mockPublisher,
        }
      );

      expect(actionResult.success).toBe(true);
      expect(actionResult.data?.amountCLP).toBe(250000);
    });
  });
});
