'use client';

import { useChat } from '@ai-sdk/react';
import { Bot, X, MessageSquare, Loader2, SendHorizontal } from 'lucide-react';
import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Chat flotante de ventas impulsado por IA.
 * Usa el hook `useChat` de @ai-sdk/react con tipado estricto.
 */
export function SalesAgentChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');

    const { messages, append, status } = useChat({
        id: 'sales-agent',
        initialMessages: [
            {
                id: '1',
                role: 'assistant',
                content: '¡Hola! Soy el agente corporativo de DropService. ¿En qué te puedo asesorar para tu próximo evento o solicitud?',
            }
        ],
    } as any) as any;

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isStreaming = status === 'streaming' || status === 'submitted';

    // Auto-scroll al final del chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isStreaming) return;

        setInput('');
        await append({ role: 'user', content: trimmed });
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {/* Burbuja Principal de Apertura */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all duration-300 ring-4 ring-indigo-600/20"
                >
                    <MessageSquare size={24} />
                </button>
            )}

            {/* Panel de Chat Abierto */}
            {isOpen && (
                <div className="flex h-[500px] w-[350px] sm:w-[400px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-white">
                        <div className="flex items-center gap-2">
                            <Bot size={20} />
                            <div>
                                <h3 className="text-sm font-semibold">DropService AI</h3>
                                <p className="text-[10px] text-indigo-100 uppercase tracking-wider">Smart Assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-full p-1 hover:bg-white/20 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Historial de Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {messages.map((m: any) => (
                            <div
                                key={m.id}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${m.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                                        : 'bg-white border border-gray-100 text-slate-800 rounded-tl-sm'
                                        }`}
                                >
                                    {(m as any).content}
                                </div>
                            </div>
                        ))}
                        {isStreaming && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                                    <Loader2 size={14} className="animate-spin text-indigo-500" />
                                    <span className="text-xs text-slate-400">Procesando...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3 bg-white">
                        <div className="flex relative">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="¿En qué podemos ayudarte?"
                                className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 pr-12 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                            <Button
                                type="submit"
                                disabled={isStreaming || !input.trim()}
                                variant="ghost"
                                size="icon"
                                className="absolute right-1.5 top-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full h-8 w-8"
                            >
                                <SendHorizontal size={18} />
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
