export interface ContextItem {
    source: string;
    content: string;
    priority: number; // Higher is more important
}

export class ContextBuilder {
    private items: ContextItem[] = [];
    private maxTokens: number;
    // Rough estimate: 1 token ~= 4 chars
    private readonly CHARS_PER_TOKEN = 4;

    constructor(maxTokens = 3000) {
        this.maxTokens = maxTokens;
    }

    add(content: string, source: string, priority = 1): this {
        if (!content) return this;
        this.items.push({ content, source, priority });
        return this;
    }

    addSystem(content: string): this {
        return this.add(content, 'system', 100);
    }

    addHistory(messages: { role: string, content: string }[]): this {
        const historyStr = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
        return this.add(historyStr, 'history', 50);
    }

    build(): string {
        // Sort by priority desc
        this.items.sort((a, b) => b.priority - a.priority);

        let currentChars = 0;
        const maxChars = this.maxTokens * this.CHARS_PER_TOKEN;
        const selectedParts: string[] = [];

        for (const item of this.items) {
            if (currentChars + item.content.length <= maxChars) {
                selectedParts.push(`[SOURCE: ${item.source}]\n${item.content}`);
                currentChars += item.content.length;
            } else {
                // Truncate if it's high priority, otherwise skip?
                // For now, naive truncation for high priority items could be added,
                // but let's just stop if we run out of space for lower priority items.
                if (item.priority >= 90) {
                    const remaining = maxChars - currentChars;
                    if (remaining > 100) {
                        selectedParts.push(`[SOURCE: ${item.source}]\n${item.content.slice(0, remaining)}...`);
                        currentChars += remaining;
                    }
                }
            }
        }

        // Return joined by double newlines
        return selectedParts.join('\n\n');
    }
}
