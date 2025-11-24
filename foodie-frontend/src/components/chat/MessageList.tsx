'use client';

import { useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

interface Message {
    id: number;
    sender: {
        id: number;
        full_name: string;
    };
    content: string;
    message_type: 'text' | 'image' | 'file' | 'system';
    is_read: boolean;
    created_at: string;
    image_attachment?: string;
    file_attachment?: string;
}

interface MessageListProps {
    messages: Message[];
    currentUserId: number;
    onMarkAsRead?: (messageId: number) => void;
}

export default function MessageList({ messages, currentUserId, onMarkAsRead }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mark messages as read when they come into view
    useEffect(() => {
        if (!onMarkAsRead) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
                        const senderId = parseInt(entry.target.getAttribute('data-sender-id') || '0');

                        if (messageId && senderId !== currentUserId) {
                            onMarkAsRead(messageId);
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );

        return () => {
            observerRef.current?.disconnect();
        };
    }, [currentUserId, onMarkAsRead]);

    const formatMessageDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        if (isToday(date)) {
            return format(date, 'HH:mm');
        } else if (isYesterday(date)) {
            return `Yesterday ${format(date, 'HH:mm')}`;
        } else {
            return format(date, 'MMM dd, HH:mm');
        }
    };

    const groupMessagesByDate = (messages: Message[]) => {
        const groups: { date: string; messages: Message[] }[] = [];
        let currentDate = '';

        messages.forEach((message) => {
            if (!message.created_at) return;

            let messageDate;
            try {
                const date = new Date(message.created_at);
                if (isNaN(date.getTime())) {
                    console.error('Invalid date for message:', message);
                    return;
                }
                messageDate = format(date, 'yyyy-MM-dd');
            } catch (e) {
                console.error('Error formatting date for message:', message, e);
                return;
            }

            if (messageDate !== currentDate) {
                currentDate = messageDate;
                groups.push({
                    date: messageDate,
                    messages: [message],
                });
            } else {
                groups[groups.length - 1].messages.push(message);
            }
        });

        return groups;
    };

    const formatDateSeparator = (dateString: string) => {
        const date = new Date(dateString);

        if (isToday(date)) {
            return 'Today';
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            return format(date, 'MMMM dd, yyyy');
        }
    };

    if (!Array.isArray(messages)) {
        return null;
    }

    const messageGroups = groupMessagesByDate([...messages].reverse());

    return (
        <div className="flex flex-1 flex-col space-y-4 overflow-y-auto p-4">
            {messageGroups.map((group) => (
                <div key={group.date} className="space-y-4">
                    {/* Date Separator */}
                    <div className="flex items-center justify-center">
                        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                            {formatDateSeparator(group.date)}
                        </div>
                    </div>

                    {/* Messages */}
                    {group.messages.map((message, index) => {
                        const isOwnMessage = message.sender.id === currentUserId;
                        const showAvatar =
                            index === 0 ||
                            group.messages[index - 1].sender.id !== message.sender.id;

                        return (
                            <div
                                key={message.id}
                                data-message-id={message.id}
                                data-sender-id={message.sender.id}
                                ref={(el) => {
                                    if (el && observerRef.current && !isOwnMessage && !message.is_read) {
                                        observerRef.current.observe(el);
                                    }
                                }}
                                className={`flex items-end gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                                    }`}
                            >
                                {/* Avatar */}
                                {showAvatar ? (
                                    <div
                                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isOwnMessage
                                            ? 'bg-accent text-white'
                                            : 'bg-white/20 text-white/80'
                                            }`}
                                    >
                                        {message.sender.full_name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </div>
                                ) : (
                                    <div className="h-8 w-8" />
                                )}

                                {/* Message Bubble */}
                                <div
                                    className={`flex max-w-[70%] flex-col ${isOwnMessage ? 'items-end' : 'items-start'
                                        }`}
                                >
                                    {message.message_type === 'system' ? (
                                        <div className="rounded-2xl bg-white/10 px-4 py-2 text-center text-sm text-white/60">
                                            {message.content}
                                        </div>
                                    ) : (
                                        <>
                                            {message.image_attachment && (
                                                <img
                                                    src={message.image_attachment}
                                                    alt="Attachment"
                                                    className="mb-2 max-h-64 rounded-2xl object-cover"
                                                />
                                            )}

                                            {message.content && (
                                                <div
                                                    className={`rounded-2xl px-4 py-2 ${isOwnMessage
                                                        ? 'bg-accent text-white'
                                                        : 'bg-white/10 text-white'
                                                        }`}
                                                >
                                                    <p className="text-sm">{message.content}</p>
                                                </div>
                                            )}

                                            {message.file_attachment && (
                                                <a
                                                    href={message.file_attachment}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`mt-2 flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition hover:opacity-80 ${isOwnMessage
                                                        ? 'bg-accent/80 text-white'
                                                        : 'bg-white/10 text-white'
                                                        }`}
                                                >
                                                    📎 {message.file_attachment.split('/').pop()}
                                                </a>
                                            )}

                                            <div
                                                className={`mt-1 flex items-center gap-1 text-xs ${isOwnMessage ? 'text-white/60' : 'text-white/40'
                                                    }`}
                                            >
                                                <span>{formatMessageDate(message.created_at)}</span>
                                                {isOwnMessage && (
                                                    <>
                                                        {message.is_read ? (
                                                            <CheckCheck className="h-3 w-3" />
                                                        ) : (
                                                            <Check className="h-3 w-3" />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}

            <div ref={messagesEndRef} />
        </div>
    );
}
