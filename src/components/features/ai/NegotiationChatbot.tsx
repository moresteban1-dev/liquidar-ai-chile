'use client';
// @ts-nocheck

import { useChat } from '@ai-sdk/react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send } from 'lucide-react';
import { UserRole } from '@/core/domain/auth/UserRole';

interface NegotiationChatbotProps {
    quotationId: string;
    role: UserRole;
}

export function NegotiationChatbot({ quotationId, role }: NegotiationChatbotProps) {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: `/api/ai/negotiation-chat`,
        body: {
            quotationId,
            role
        },
        initialMessages: [
            {
                id: 'system-intro',
                role: 'assistant',
                content: role === UserRole.ADMIN
                    ? 'Hola, soy el AI Negotiator. Estoy monitoreando las cotizaciones de esta solicitud. ¿En qué te ayudo?'
                    : 'Hola Proveedor. He revisado tu presupuesto. Estoy aquí para resolver dudas técnicas o negociar partidas comerciales.'
            }
        ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any) as any;

    return (
        <Card className="w-full h-[500px] flex flex-col border-emerald-500/20 shadow-md">
            <CardHeader className="py-3 border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <Bot className="w-4 h-4 text-emerald-600" />
                    AI Negotiator Agent Hub
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                        {messages.map((m: any) => (
                            <div
                                key={m.id}
                                className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                    }`}
                            >
                                <div className={`p-2 rounded-full shrink-0 ${m.role === 'user' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                                    {m.role === 'user' ? (
                                        <User className="w-4 h-4 text-blue-700" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-emerald-700" />
                                    )}
                                </div>
                                <div
                                    className={`rounded-lg px-4 py-2 max-w-[80%] text-sm ${m.role === 'user'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                                        }`}
                                >
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {String((m as any).content)}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-gray-500 text-sm p-4">
                                <Bot className="w-4 h-4 animate-pulse text-emerald-500" />
                                Analizando...
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-3 border-t bg-gray-50/50">
                <form
                    onSubmit={handleSubmit}
                    className="flex w-full items-center gap-2"
                >
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder={role === UserRole.ADMIN ? "Pregunta sobre márgenes..." : "Discutir ajuste de presupuesto..."}
                        className="flex-1 bg-white"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input?.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
