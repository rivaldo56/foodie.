'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  type Conversation,
  type Message
} from '@/lib/api/messages';
import MessageList from '@/components/chat/MessageList';
import { MessageCircle, Send, Search, ArrowLeft, MoreVertical, Phone, Video, Inbox, MessageSquare } from 'lucide-react';

export default function ChefMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'primary' | 'requests'>('all');

  // Initialize active conversation from URL
  useEffect(() => {
    const conversationIdParam = searchParams.get('conversationId');
    if (conversationIdParam) {
      setActiveConversationId(Number(conversationIdParam));
    }
  }, [searchParams]);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await getConversations();
        if (response.data) {
          const data = response.data as any;
          if (Array.isArray(data)) {
            setConversations(data);
          } else if (data.results && Array.isArray(data.results)) {
            setConversations(data.results);
          } else {
            setConversations([]);
          }
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  // Load messages when active conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversationId) return;

      setIsLoadingMessages(true);
      try {
        const response = await getConversationMessages(activeConversationId);
        if (response.data) {
          const data = response.data as any;
          if (Array.isArray(data)) {
            setMessages(data);
          } else if (data.results && Array.isArray(data.results)) {
            setMessages(data.results);
          } else {
            setMessages([]);
          }
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();

    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [activeConversationId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeConversationId || isSending) return;

    setIsSending(true);
    try {
      const response = await sendMessage(activeConversationId, inputMessage.trim());
      if (response.data) {
        setMessages((prev) => [...prev, response.data!]);
        setInputMessage('');

        // Update conversation list and mark as replied
        setConversations((prev) =>
          prev.map(c =>
            c.id === activeConversationId
              ? { ...c, last_message: response.data!, updated_at: new Date().toISOString(), has_replied: true }
              : c
          ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectConversation = (id: number) => {
    setActiveConversationId(id);
    router.push(`/chef/messages?conversationId=${id}`);
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const filteredConversations = conversations.filter(c => {
    if (activeTab === 'all') return true;
    if (activeTab === 'primary') return c.has_replied;
    if (activeTab === 'requests') return !c.has_replied;
    return true;
  });

  if (authLoading) return null;

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-3xl border border-white/10 bg-surface-elevated shadow-2xl">
      {/* Sidebar - Conversations List */}
      <div className={`w-full md:w-80 flex flex-col border-r border-white/10 bg-surface ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Messages</h2>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-white/5 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-accent text-white shadow-lg' : 'text-muted hover:text-white'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('primary')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'primary' ? 'bg-accent text-white shadow-lg' : 'text-muted hover:text-white'
                }`}
            >
              Primary
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'requests' ? 'bg-accent text-white shadow-lg' : 'text-muted hover:text-white'
                }`}
            >
              Requests
              {conversations.filter(c => !c.has_replied).length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                  {conversations.filter(c => !c.has_replied).length}
                </span>
              )}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full rounded-xl bg-white/5 border border-white/10 py-2 pl-9 pr-4 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="p-4 text-center text-muted">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted mx-auto mb-3 opacity-50" />
              <p className="text-muted">No {activeTab === 'all' ? '' : activeTab} messages</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredConversations.map((conv) => {
                // Robust other user resolution
                let otherUser = conv.other_user;
                if (!otherUser) {
                  // If I am the chef, the other user is the client
                  if (user?.role === 'chef') {
                    otherUser = conv.client;
                  }
                  // If I am the client, the other user is the chef
                  else if (user?.role === 'client') {
                    otherUser = conv.chef; // Note: conv.chef is a User object in serializer
                  }
                  // Fallback
                  else {
                    otherUser = (conv as any).client || (conv as any).chef;
                  }
                }

                const displayName = otherUser?.full_name || otherUser?.username || 'User';
                const isActive = conv.id === activeConversationId;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-white/5 transition-colors text-left ${isActive ? 'bg-white/5 border-l-2 border-accent' : ''}`}
                  >
                    <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold flex-shrink-0">
                      {displayName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className={`font-medium truncate ${isActive ? 'text-white' : 'text-white/90'}`}>
                          {displayName}
                        </span>
                        {conv.last_message && (
                          <span className="text-xs text-muted flex-shrink-0 ml-2">
                            {new Date(conv.last_message.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted truncate">
                        {conv.last_message?.content || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#0f0c0a] ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {activeConversationId ? (
          <>
            {/* Chat Header */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-surface/50 backdrop-blur">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConversationId(null)}
                  className="md:hidden p-2 -ml-2 text-muted hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                  {(activeConversation?.other_user?.full_name || activeConversation?.client?.full_name || 'U').charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {activeConversation?.other_user?.full_name || activeConversation?.client?.full_name || 'Chat'}
                  </h3>
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                    Online
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <button className="p-2 hover:bg-white/10 rounded-full transition">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition">
                  <Video className="h-4 w-4" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* Messages List */}
            <div className="flex-1 overflow-hidden relative">
              {isLoadingMessages ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted">
                  Loading messages...
                </div>
              ) : (
                <MessageList
                  messages={messages}
                  currentUserId={user?.id || 0}
                />
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-surface/30">
              <div className="flex items-end gap-2 max-w-4xl mx-auto">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all resize-none min-h-[48px] max-h-32"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isSending}
                  className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-white shadow-lg hover:bg-accent-strong disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="h-5 w-5 ml-0.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted p-8">
            <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <MessageCircle className="h-10 w-10 opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
            <p className="max-w-xs text-center">
              Choose a chat from the sidebar to view messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
