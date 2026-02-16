import { apiRequest, type ApiResponse, type User } from '@/lib/api';

export interface Message {
    id: string | number;
    sender: User;
    content: string;
    message_type: 'text' | 'image' | 'file' | 'system';
    is_read: boolean;
    created_at: string;
    image_attachment?: string;
    file_attachment?: string;
}

export interface Conversation {
    id: string | number;
    client: User;
    chef: User;
    other_user?: User; // Computed on frontend
    last_message?: Message;
    updated_at: string;
    unread_count: number;
    has_replied: boolean;
}

export async function getConversations(): Promise<ApiResponse<Conversation[]>> {
    return apiRequest<Conversation[]>({
        url: '/chat/rooms/',
        method: 'GET',
    }, true);
}

export async function getConversationMessages(conversationId: string | number): Promise<ApiResponse<Message[]>> {
    return apiRequest<Message[]>({
        url: `/chat/rooms/${conversationId}/messages/`,
        method: 'GET',
    }, true);
}

export async function startConversation(userId: string | number): Promise<ApiResponse<Conversation>> {
    return apiRequest<Conversation>({
        url: '/chat/rooms/create/',
        method: 'POST',
        data: { chef_id: userId },
    }, true);
}

export async function sendMessage(conversationId: string | number, content: string, attachment?: File): Promise<ApiResponse<Message>> {
    const formData = new FormData();
    formData.append('chat_room', String(conversationId));
    formData.append('content', content);
    formData.append('message_type', attachment ? (attachment.type.startsWith('image/') ? 'image' : 'file') : 'text');

    if (attachment) {
        if (attachment.type.startsWith('image/')) {
            formData.append('image_attachment', attachment);
        } else {
            formData.append('file_attachment', attachment);
        }
    }

    return apiRequest<Message>({
        url: '/chat/messages/create/',
        method: 'POST',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }, true);
}
