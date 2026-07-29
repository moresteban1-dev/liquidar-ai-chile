import { Result } from '../../../domain/shared/Result';
import { Money } from '../../../domain/value-objects/Money';
import { Rut } from '../../../domain/value-objects/Rut';

export interface McpToolDefinition {
  name: string;
  description: string;
  parametersSchema: Record<string, unknown>;
}

export interface McpToolCallRequest {
  name: string;
  arguments: Record<string, unknown>;
}

export interface McpToolCallResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

/**
 * Model Context Protocol (MCP) Server for Liquidar AI Chile v2.0.
 * Exposes standardized tools for LLM agents to safely interact with auctions, tax calculations, and fraud checks.
 */
export class AuctionMcpServer {
  private readonly tools = new Map<string, (args: any) => Promise<Result<unknown>>>();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools(): void {
    // Tool 1: Evaluate Chilean Tax (19% IVA)
    this.registerTool(
      'calculate_chilean_tax',
      async (args: { amountCLP: number; isGross: boolean }) => {
        const moneyRes = Money.create(args.amountCLP);
        if (moneyRes.isFailure) return Result.fail(moneyRes.getError());

        const money = moneyRes.getValue();
        const calculation = args.isGross ? money.extractIvaFromGross() : money.calculateIvaFromNet();

        return Result.ok({
          netCLP: calculation.net.value,
          formattedNet: calculation.net.format(),
          ivaCLP: calculation.iva.value,
          formattedIva: calculation.iva.format(),
          totalCLP: calculation.total.value,
          formattedTotal: calculation.total.format(),
        });
      }
    );

    // Tool 2: Validate Chilean RUT
    this.registerTool(
      'validate_rut',
      async (args: { rutString: string }) => {
        const rutRes = Rut.create(args.rutString);
        if (rutRes.isFailure) {
          return Result.ok({ isValid: false, reason: rutRes.getError() });
        }
        const rut = rutRes.getValue();
        return Result.ok({
          isValid: true,
          normalizedRut: rut.value,
          formattedRut: rut.formatted,
        });
      }
    );

    // Tool 3: Assess Bid Risk Anomaly Score
    this.registerTool(
      'evaluate_bid_risk',
      async (args: { proposedAmountCLP: number; currentPriceCLP: number; bidderRut: string }) => {
        const rutRes = Rut.create(args.bidderRut);
        if (rutRes.isFailure) {
          return Result.fail(`InvalidRut: ${rutRes.getError()}`);
        }

        const jumpRatio = args.currentPriceCLP > 0 
          ? (args.proposedAmountCLP - args.currentPriceCLP) / args.currentPriceCLP
          : 0;

        let riskScore = 0; // 0 to 100
        let flagged = false;
        let reason = 'Normal bidding activity';

        if (jumpRatio > 5.0) {
          riskScore = 85;
          flagged = true;
          reason = `Extreme bid jump: Proposed bid is ${(jumpRatio * 100).toFixed(0)}% above current price.`;
        } else if (args.proposedAmountCLP > 10000000) {
          riskScore = 60;
          reason = 'High-value transaction: Requires automated credit verification.';
        }

        return Result.ok({
          riskScore,
          flaggedForFraud: flagged,
          jumpRatio: Number(jumpRatio.toFixed(2)),
          reason,
        });
      }
    );
  }

  public registerTool(name: string, handler: (args: any) => Promise<Result<unknown>>): void {
    this.tools.set(name, handler);
  }

  public getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  public async handleToolCall(request: McpToolCallRequest): Promise<McpToolCallResponse> {
    const handler = this.tools.get(request.name);
    if (!handler) {
      return {
        success: false,
        error: `MCPToolNotFound: Tool '${request.name}' is not registered on this MCP server.`,
      };
    }

    try {
      const result = await handler(request.arguments);
      if (result.isFailure) {
        return {
          success: false,
          error: result.getError() as string,
        };
      }
      return {
        success: true,
        result: result.getValue(),
      };
    } catch (err) {
      return {
        success: false,
        error: `MCPToolExecutionError: ${(err as Error).message}`,
      };
    }
  }
}
