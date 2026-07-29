import { describe, it, expect, vi } from 'vitest';
import { Result } from '../domain/shared/Result';
import { Money } from '../domain/value-objects/Money';
import { Rut } from '../domain/value-objects/Rut';
import { Auction } from '../domain/entities/Auction';
import { Order } from '../domain/entities/Order';
import { PlaceBidUseCase } from '../application/use-cases/PlaceBidUseCase';
import { IAuctionRepository } from '../domain/ports/IAuctionRepository';
import { IQASentinelAgent } from '../domain/ports/IQASentinelAgent';
import { IEventPublisher } from '../domain/ports/IEventPublisher';

describe('Sprint 1 Domain & Application Core (Liquidar AI Chile v2.0)', () => {
  describe('Result Pattern Utility', () => {
    it('should create successful result and access value', () => {
      const res = Result.ok<number>(100);
      expect(res.isSuccess).toBe(true);
      expect(res.isFailure).toBe(false);
      expect(res.getValue()).toBe(100);
    });

    it('should create failed result and access error', () => {
      const res = Result.fail<number>('SomeError');
      expect(res.isSuccess).toBe(false);
      expect(res.isFailure).toBe(true);
      expect(res.getError()).toBe('SomeError');
    });
  });

  describe('Money Value Object (CLP)', () => {
    it('should create valid CLP money and format correctly', () => {
      const moneyRes = Money.create(1500000);
      expect(moneyRes.isSuccess).toBe(true);
      const money = moneyRes.getValue();
      expect(money.value).toBe(1500000);
      expect(money.format()).toContain('1.500.000');
    });

    it('should fail when creating negative money', () => {
      const moneyRes = Money.create(-500);
      expect(moneyRes.isFailure).toBe(true);
      expect(moneyRes.getError()).toContain('MoneyAmountNegative');
    });

    it('should calculate 19% Chilean IVA correctly from Net', () => {
      const netMoney = Money.create(100000).getValue();
      const { net, iva, total } = netMoney.calculateIvaFromNet();
      expect(net.value).toBe(100000);
      expect(iva.value).toBe(19000);
      expect(total.value).toBe(119000);
    });

    it('should extract 19% Chilean IVA correctly from Gross', () => {
      const grossMoney = Money.create(119000).getValue();
      const { net, iva, total } = grossMoney.extractIvaFromGross();
      expect(net.value).toBe(100000);
      expect(iva.value).toBe(19000);
      expect(total.value).toBe(119000);
    });
  });

  describe('Rut Value Object (Chilean Modulo 11)', () => {
    it('should validate and format a valid Chilean RUT', () => {
      // 12.345.678-5 (12345678-5)
      const rutResult = Rut.create('123456785');
      expect(rutResult.isSuccess).toBe(true);
      const rut = rutResult.getValue();
      expect(rut.formatted).toBe('12.345.678-5');
    });

    it('should reject an invalid Chilean RUT verification digit', () => {
      const rutResult = Rut.create('123456789');
      expect(rutResult.isFailure).toBe(true);
      expect(rutResult.getError()).toContain('RutInvalidVerificationDigit');
    });
  });

  describe('Auction Aggregate Root', () => {
    const sellerRut = Rut.create('765432103').getValue();
    const bidderRut = Rut.create('123456785').getValue();
    const startingPrice = Money.create(100000).getValue();
    const reservePrice = Money.create(150000).getValue();
    const minIncrement = Money.create(10000).getValue();

    it('should create auction, activate it, and accept valid bids', () => {
      const now = new Date();
      const endDate = new Date(now.getTime() + 3600000);

      const auctionResult = Auction.create({
        id: 'auction-101',
        sellerRut,
        title: 'Lote Iluminación Profesional Escénica',
        description: '10x Focos LED Par 64 en liquidación por quiebra.',
        startingPrice,
        reservePrice,
        minBidIncrement: minIncrement,
        startDate: now,
        endDate,
      });

      expect(auctionResult.isSuccess).toBe(true);
      const auction = auctionResult.getValue();
      expect(auction.status).toBe('DRAFT');

      auction.activate();
      expect(auction.status).toBe('ACTIVE');

      const bidAmount = Money.create(120000).getValue();
      const bidResult = auction.placeBid('bid-1', bidderRut, bidAmount, now);
      expect(bidResult.isSuccess).toBe(true);

      expect(auction.currentPrice.value).toBe(120000);
      expect(auction.domainEvents.length).toBe(1);
      expect(auction.domainEvents[0].eventName).toBe('BidPlaced');
    });

    it('should reject seller bidding on their own auction', () => {
      const now = new Date();
      const endDate = new Date(now.getTime() + 3600000);

      const auction = Auction.create({
        id: 'auction-102',
        sellerRut,
        title: 'Lote Sonido Array',
        description: 'Line array de liquidación',
        startingPrice,
        reservePrice,
        minBidIncrement: minIncrement,
        startDate: now,
        endDate,
      }).getValue();

      auction.activate();

      const bidResult = auction.placeBid('bid-2', sellerRut, Money.create(120000).getValue(), now);
      expect(bidResult.isFailure).toBe(true);
      expect(bidResult.getError()).toContain('AuctionSellerCannotBid');
    });
  });

  describe('PlaceBidUseCase Integration', () => {
    it('should execute placing a bid through ports successfully', async () => {
      const sellerRut = Rut.create('765432103').getValue();
      const now = new Date();
      const auction = Auction.create({
        id: 'auction-300',
        sellerRut,
        title: 'Lote Proyectores 4K laser',
        description: 'Proyectores laser liquidación directa',
        startingPrice: Money.create(500000).getValue(),
        reservePrice: Money.create(800000).getValue(),
        minBidIncrement: Money.create(50000).getValue(),
        startDate: now,
        endDate: new Date(now.getTime() + 3600000),
      }).getValue();
      auction.activate();

      const mockRepo: IAuctionRepository = {
        findById: vi.fn().mockResolvedValue(Result.ok(auction)),
        save: vi.fn().mockResolvedValue(Result.ok(undefined)),
        updateBid: vi.fn().mockResolvedValue(Result.ok(undefined)),
      };

      const mockQA: IQASentinelAgent = {
        evaluateBid: vi.fn().mockResolvedValue(Result.ok({
          isApproved: true,
          riskScore: 5,
          flaggedForFraud: false,
        })),
      };

      const mockPublisher: IEventPublisher = {
        publish: vi.fn().mockResolvedValue(Result.ok(undefined)),
        publishBatch: vi.fn().mockResolvedValue(Result.ok(undefined)),
      };

      const useCase = new PlaceBidUseCase(mockRepo, mockQA, mockPublisher);

      const response = await useCase.execute({
        auctionId: 'auction-300',
        bidderRut: '123456785',
        amountCLP: 600000,
      });

      expect(response.isSuccess).toBe(true);
      expect(response.getValue().amountCLP).toBe(600000);
      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockPublisher.publishBatch).toHaveBeenCalled();
    });
  });
});
