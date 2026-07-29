import { Server } from 'http';

export interface ClosableResource {
  name: string;
  close: () => Promise<void> | void;
}

export interface GracefulShutdownConfig {
  server?: Server;
  timeoutMs?: number;
  resources?: ClosableResource[];
}

/**
 * Enterprise Graceful Shutdown Handler for Node.js / Next.js production deployments.
 * Intercepts SIGTERM and SIGINT signals, stops receiving new traffic,
 * finishes active in-flight requests/jobs, and safely disconnects Redis & Supabase connections.
 */
export class GracefulShutdownManager {
  private isShuttingDown = false;
  private readonly timeoutMs: number;
  private readonly resources: ClosableResource[];
  private readonly server?: Server;

  constructor(config: GracefulShutdownConfig = {}) {
    this.timeoutMs = config.timeoutMs || 10000;
    this.resources = config.resources || [];
    this.server = config.server;
  }

  public registerResource(resource: ClosableResource): void {
    this.resources.push(resource);
  }

  public listenSignals(): void {
    const handleSignal = (signal: string) => {
      this.executeShutdown(signal).catch((err) => {
        console.error(`[GracefulShutdownError] Failure during ${signal} shutdown:`, err);
        process.exit(1);
      });
    };

    process.once('SIGTERM', () => handleSignal('SIGTERM'));
    process.once('SIGINT', () => handleSignal('SIGINT'));
  }

  public async executeShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      console.warn(`[GracefulShutdown] Shutdown already in progress. Ignoring ${signal}.`);
      return;
    }
    this.isShuttingDown = true;
    console.log(`[GracefulShutdown] Initiating graceful shutdown via signal ${signal}...`);

    // Forceful exit timer fallback if cleanup takes longer than timeoutMs
    const timer = setTimeout(() => {
      console.error(`[GracefulShutdownTimeout] Shutdown exceeded ${this.timeoutMs}ms limit. Forcing exit.`);
      process.exit(1);
    }, this.timeoutMs);

    // Unref timer so it won't keep the process alive if work finishes faster
    if (timer.unref) {
      timer.unref();
    }

    try {
      // 1. Close HTTP server first to reject incoming connections
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server?.close((err) => {
            if (err) {
              console.error('[GracefulShutdown] Error closing HTTP server:', err);
              return reject(err);
            }
            console.log('✔ [GracefulShutdown] HTTP Server closed successfully.');
            resolve();
          });
        });
      }

      // 2. Safely close all registered resources (BullMQ queues, Redis, DB connection pools)
      for (const resource of this.resources) {
        try {
          console.log(`[GracefulShutdown] Closing resource: ${resource.name}...`);
          await resource.close();
          console.log(`✔ [GracefulShutdown] Resource ${resource.name} closed successfully.`);
        } catch (resErr) {
          console.error(`[GracefulShutdown] Error closing resource ${resource.name}:`, resErr);
        }
      }

      console.log('✔ [GracefulShutdown] All resources closed cleanly. Exiting process.');
    } finally {
      clearTimeout(timer);
    }
  }

  public get isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }
}
