'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Sparkles, UtensilsCrossed, Calendar, Loader2, Minimize2, Maximize2, Utensils } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    intent?: string;
    bookingData?: any;
}

interface MealRecommendation {
    id: number;
    name: string;
    price_per_serving: number;
    description: string;
}

export default function AIChatbot() {
    const { user, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm Foodie AI. I can help you find the perfect chef, recommend meals, or assist with booking. What would you like to do today?",
            timestamp: new Date(),
        },
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [mealRecommendations, setMealRecommendations] = useState<MealRecommendation[]>([]);

    const sendMessage = async () => {
        if (!inputMessage.trim() || !isAuthenticated) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:8000/api/ai/chatbot/message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({
                    message: inputMessage,
                    session_id: sessionId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                const aiMessage: Message = {
                    id: data.message_id?.toString() || Date.now().toString(),
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date(),
                    intent: data.intent,
                    bookingData: data.booking_data,
                };

                setMessages((prev) => [...prev, aiMessage]);
                if (data.session_id) {
                    setSessionId(data.session_id);
                }
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            const errorMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: "I'm sorry, I'm having trouble processing your request. Please try again.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const getMealRecommendations = async () => {
        if (!isAuthenticated) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:8000/api/ai/chatbot/recommend-meals/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({
                    dietary_requirements: [],
                    cuisine_preference: null,
                    budget: null,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                const aiMessage: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: data.recommendations,
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, aiMessage]);
                setMealRecommendations(data.menu_items || []);
            }
        } catch (error) {
            console.error('Failed to get meal recommendations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong shadow-glow transition hover:scale-110"
                >
                    <Sparkles className="h-7 w-7 text-white" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-96 flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a0f0f] to-[#0f0c0a] shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between rounded-t-3xl border-b border-white/10 bg-gradient-to-r from-accent/20 to-accent-strong/20 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-white">Foodie AI</p>
                                <p className="text-xs text-white/60">Your culinary assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="border-b border-white/10 bg-white/5 p-3">
                        <div className="flex gap-2">
                            <button
                                onClick={getMealRecommendations}
                                disabled={isLoading}
                                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
                            >
                                <UtensilsCrossed className="h-3 w-3" />
                                Recommend Meals
                            </button>
                            <button
                                onClick={() => setInputMessage('Help me book a chef')}
                                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/20"
                            >
                                <Calendar className="h-3 w-3" />
                                Book Chef
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                        ? 'bg-accent text-white'
                                        : 'bg-white/10 text-white'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p className="mt-1 text-xs opacity-60">
                                        {message.timestamp.toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Meal Recommendations */}
                        {mealRecommendations.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-white/60">Recommended Meals:</p>
                                {mealRecommendations.map((meal) => (
                                    <div
                                        key={meal.id}
                                        className="rounded-2xl border border-white/10 bg-white/5 p-3"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-white">{meal.name}</p>
                                                <p className="mt-1 text-xs text-white/60">{meal.description}</p>
                                            </div>
                                            <p className="ml-2 text-sm font-semibold text-accent">
                                                KSh {meal.price_per_serving}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl bg-white/10 px-4 py-3">
                                    <div className="flex gap-1">
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '0ms' }} />
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '150ms' }} />
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="border-t border-white/10 p-4">
                        <div className="flex items-end gap-2">
                            <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask me anything..."
                                rows={1}
                                disabled={isLoading}
                                className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 backdrop-blur transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!inputMessage.trim() || isLoading}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-strong disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
