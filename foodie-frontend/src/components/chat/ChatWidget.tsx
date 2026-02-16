'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import MessageList from './MessageList';

interface ChatWidgetProps {
    recipientId?: string | number;
    recipientName?: string;
}

interface Message {
    id: string | number;
    sender: {
        id: string | number;
        full_name: string;
    };
    content: string;
    message_type: 'text' | 'image' | 'file' | 'system';
    is_read: boolean;
    created_at: string;
}

export default function ChatWidget({ recipientId, recipientName }: ChatWidgetProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [isTyping, setIsTyping] = useState(false);

    // WebSocket connection
    const wsUrl = user && recipientId
        ? `ws://localhost:8000/ws/chat/${user.id}/${recipientId}/`
        : '';

    const { sendMessage, isConnected } = useWebSocket({
        url: wsUrl,
        onMessage: (data) => {
            if (data.type === 'chat_message') {
                const newMessage: Message = {
                    id: data.message.id,
                    sender: data.message.sender,
                    content: data.message.content,
                    message_type: data.message.message_type,
                    is_read: data.message.is_read,
                    created_at: data.message.created_at,
                };

                setMessages((prev) => [...prev, newMessage]);

                // Update unread count if chat is minimized or closed
                if (!isOpen || isMinimized) {
                    setUnreadCount((prev) => prev + 1);
                }

                // Play notification sound
                if (data.message.sender.id !== user?.id) {
                    playNotificationSound();
                }
            } else if (data.type === 'typing_indicator') {
                setIsTyping(data.is_typing);
            } else if (data.type === 'read_receipt') {
                // Update message read status
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === data.message_id ? { ...msg, is_read: true } : msg
                    )
                );
            }
        },
    });

    const playNotificationSound = () => {
        // Simple notification sound
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
            // Ignore errors (e.g., user hasn't interacted with page yet)
        });
    };

    const handleSendMessage = () => {
        if (!inputMessage.trim() || !isConnected) return;

        sendMessage({
            type: 'chat_message',
            message: inputMessage.trim(),
        });

        setInputMessage('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleMarkAsRead = (messageId: string | number) => {
        sendMessage({
            type: 'mark_as_read',
            message_id: messageId,
        });
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0);
            setIsMinimized(false);
        }
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    if (!user || !recipientId) {
        return null;
    }

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={toggleChat}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent shadow-glow transition hover:scale-110"
                >
                    <MessageCircle className="h-6 w-6 text-white" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex w-96 flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a0f0f] to-[#0f0c0a] shadow-2xl transition-all ${isMinimized ? 'h-16' : 'h-[600px]'
                        }`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between rounded-t-3xl border-b border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                                {recipientName?.split(' ').map((n) => n[0]).join('') || '?'}
                            </div>
                            <div>
                                <p className="font-medium text-white">{recipientName || 'Chat'}</p>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'
                                            }`}
                                    />
                                    <span className="text-xs text-white/60">
                                        {isConnected ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleMinimize}
                                className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                            >
                                {isMinimized ? (
                                    <Maximize2 className="h-4 w-4" />
                                ) : (
                                    <Minimize2 className="h-4 w-4" />
                                )}
                            </button>
                            <button
                                onClick={toggleChat}
                                className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    {!isMinimized && (
                        <>
                            <MessageList
                                messages={messages}
                                currentUserId={user.id}
                                onMarkAsRead={handleMarkAsRead}
                            />

                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="px-4 pb-2">
                                    <div className="flex items-center gap-2 text-sm text-white/60">
                                        <div className="flex gap-1">
                                            <div className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '0ms' }} />
                                            <div className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '150ms' }} />
                                            <div className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span>{recipientName} is typing...</span>
                                    </div>
                                </div>
                            )}

                            {/* Input */}
                            <div className="border-t border-white/10 p-4">
                                <div className="flex items-end gap-2">
                                    <textarea
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message..."
                                        rows={1}
                                        className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 backdrop-blur transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || !isConnected}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-strong disabled:opacity-50"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
