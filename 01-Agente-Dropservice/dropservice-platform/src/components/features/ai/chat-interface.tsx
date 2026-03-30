'use client';

import { useState, useRef, useEffect } from 'react';
import { useAsyncAI } from '@/hooks/use-async-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types matching Agent Output
interface AgentResponse {
    response: string;
    history: Array<{ role: 'user' | 'model'; content: string }>;
    next?: string;
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([]);
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const { execute, status, data } = useAsyncAI<AgentResponse>();

    // Update local messages when AI completes
    useEffect(() => {
        if (status === 'completed' && data) {
            // We use the history returned by the server to stay in sync
            setMessages(data.history);
        }
    }, [status, data]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, status]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || status === 'submitting' || status === 'polling') return;

        const userMsg = inputValue.trim();
        setInputValue('');

        // Optimistic update
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

        await execute('/api/ai/agent', {
            message: userMsg,
            // We could pass orderId/data here if this was context-aware
        });
    };

    return (
        <Card className="flex flex-col h-[600px] w-full max-w-2xl mx-auto shadow-lg border-2">
            <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="flex items-center gap-2">
                    🤖 Supervisor AI
                    {status === 'polling' && <span className="text-xs font-normal text-muted-foreground animate-pulse">(Thinking...)</span>}
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                    <div className="space-y-4" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="text-center text-muted-foreground mt-20">
                                Start a conversation with the Dropservice Agent.
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                                    msg.role === 'user'
                                        ? "ml-auto bg-primary text-primary-foreground"
                                        : "bg-muted"
                                )}
                            >
                                {msg.content}
                            </div>
                        ))}

                        {(status === 'submitting' || status === 'polling') && (
                            <div className="flex bg-muted w-max rounded-lg px-3 py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-4 border-t bg-background">
                <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your message..."
                        disabled={status === 'submitting' || status === 'polling'}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={status === 'submitting' || status === 'polling' || !inputValue.trim()}
                    >
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
