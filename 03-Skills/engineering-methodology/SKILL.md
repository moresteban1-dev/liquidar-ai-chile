---
name: engineering-methodology
description: A unified hub for high-performance engineering practices, including Kaizen (continuous improvement), prompt engineering patterns, and durable workflow automation.
---

# Engineering Methodology & High Performance

This skill integrates mindset, communication, and infrastructure patterns to ensure software engineering excellence.

## 1. Kaizen (Continuous Improvement)

Kaizen is the philosophy of small, incremental changes that result in substantial improvements over time.

* **Audit Everything**: Regularly review code for "smells" and technical debt.
* **Standardize**: Create and follow patterns to reduce cognitive load.
* **Measure & Iterate**: Use metrics and feedback loops to drive development.

## 2. Prompt Engineering Patterns

Advanced strategies for interacting with AI models to get deterministic, high-quality results.

* **Chain of Thought (CoT)**: Force the model to reason step-by-step.
* **Discriminated Unions**: Use clear types and specific roles to avoid hallucinations.
* **Systematic Constraints**: Define clear "Self-Correction" loops within prompts.

## 3. Workflow Automation (Durable Execution)

Infrastructure that makes AI agents and complex business logic reliable.

* **Durable Execution**: Use platforms like Inngest or Temporal to ensure workflows resume on failure.
* **Idempotency Gold Standard**: ALWAYS use idempotency keys for external calls to prevent duplicate side-effects.
* **Event-Driven Patterns**: Prefer async, event-driven flows over brittle synchronous scripts.

### Automation Patterns

- **Sequential**: Steps execute in order; each output is the next input.
* **Parallel**: Independent steps run simultaneously with fan-in aggregation.
* **Orchestrator-Worker**: Central coordinator dispatches work to specialized workers.

### Sharp Edges & Solutions

| Issue | Solution |
|-------|----------|
| **Duplicate side-effects** | Use unique idempotency keys per operation. |
| **Silent background failures** | Implement robust `onFailure` handlers and alerting. |
| **API Rate Limits** | Use exponential backoff and jitter for all retries. |
| **Large Payloads** | Pass data references/URIs instead of massive blobs in history. |
