import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import ChatRoom, Message
from .serializers import MessageSerializer

from django.conf import settings

User = get_user_model()


def _get_user_id_from_scope(scope):
    """Safely extract user_id from scope, handling missing url_route"""
    url_kwargs = scope.get('url_route', {}).get('kwargs', {})
    user_id = url_kwargs.get('user_id')
    if user_id:
        return user_id
    
    # Fallback: extract from path if url_route not available (for tests)
    # SECURITY: Only allow this in DEBUG mode
    if settings.DEBUG:
        path = scope.get('path', '')
        # Path format: /ws/notifications/{user_id}/
        parts = [p for p in path.split('/') if p]
        if len(parts) >= 3 and parts[0] == 'ws' and parts[1] == 'notifications':
            return parts[2]
    
    # Final fallback to authenticated user
    user = scope.get('user')
    if user and getattr(user, 'is_authenticated', False):
        return getattr(user, 'id', None)
    return None


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        url_kwargs = self.scope.get('url_route', {}).get('kwargs', {})
        self.room_id = url_kwargs.get('room_id')
        
        # Fallback: extract room_id from path if url_route not available (for tests)
        # SECURITY: Only allow this in DEBUG mode
        if not self.room_id and settings.DEBUG:
            path = self.scope.get('path', '')
            # Path format: /ws/chat/{room_id}/
            parts = [p for p in path.split('/') if p]
            if len(parts) >= 3 and parts[0] == 'ws' and parts[1] == 'chat':
                self.room_id = parts[2]
        
        if not self.room_id:
            await self.close()
            return
            
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope["user"]

        # Check if user is authenticated
        if self.user.is_anonymous:
            await self.close()
            return

        # Check if user has access to this chat room
        has_access = await self.check_room_access()
        if not has_access:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send user join notification
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_join',
                'user': self.user.username,
                'user_id': self.user.id
            }
        )

    async def disconnect(self, close_code):
        # Send user leave notification
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_leave',
                    'user': self.user.username,
                    'user_id': self.user.id
                }
            )

            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type', 'chat_message')

            if message_type == 'chat_message':
                await self.handle_chat_message(text_data_json)
            elif message_type == 'typing':
                await self.handle_typing(text_data_json)
            elif message_type == 'read_receipt':
                await self.handle_read_receipt(text_data_json)

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON format'
            }))

    async def handle_chat_message(self, data):
        message_content = data.get('message', '')
        message_type = data.get('message_type', 'text')
        
        if not message_content.strip():
            return

        # Save message to database
        message = await self.save_message(message_content, message_type)
        
        if message:
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'user': self.user.username,
                    'user_id': self.user.id,
                    'timestamp': message['created_at']
                }
            )

    async def handle_typing(self, data):
        is_typing = data.get('is_typing', False)
        
        # Send typing indicator to room group (excluding sender)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user': self.user.username,
                'user_id': self.user.id,
                'is_typing': is_typing
            }
        )

    async def handle_read_receipt(self, data):
        message_id = data.get('message_id')
        
        if message_id:
            await self.mark_message_read(message_id)
            
            # Send read receipt to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'read_receipt',
                    'message_id': message_id,
                    'user_id': self.user.id
                }
            )

    # Receive message from room group
    async def chat_message(self, event):
        # Don't send message back to sender
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'chat_message',
                'message': event['message'],
                'user': event['user'],
                'user_id': event['user_id'],
                'timestamp': event['timestamp']
            }))

    async def user_join(self, event):
        # Don't send join notification to the user who joined
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_join',
                'user': event['user'],
                'user_id': event['user_id']
            }))

    async def user_leave(self, event):
        # Don't send leave notification to the user who left
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_leave',
                'user': event['user'],
                'user_id': event['user_id']
            }))

    async def typing_indicator(self, event):
        # Don't send typing indicator back to sender
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing_indicator',
                'user': event['user'],
                'user_id': event['user_id'],
                'is_typing': event['is_typing']
            }))

    async def read_receipt(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'message_id': event['message_id'],
            'user_id': event['user_id']
        }))

    @database_sync_to_async
    def check_room_access(self):
        """Check if user has access to the chat room"""
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            return room.client == self.user or room.chef == self.user
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content, message_type='text'):
        """Save message to database"""
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            message = Message.objects.create(
                chat_room=room,
                sender=self.user,
                content=content,
                message_type=message_type
            )
            serializer = MessageSerializer(message)
            return serializer.data
        except ChatRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def mark_message_read(self, message_id):
        """Mark message as read"""
        try:
            message = Message.objects.get(id=message_id)
            if message.sender != self.user:
                message.is_read = True
                message.read_at = timezone.now()
                message.save()
        except Message.DoesNotExist:
            pass


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = _get_user_id_from_scope(self.scope)
        self.user = self.scope["user"]

        # Check if user is authenticated and accessing their own notifications
        if self.user.is_anonymous or not self.user_id or str(self.user.id) != str(self.user_id):
            await self.close()
            return

        self.notification_group_name = f'notifications_{self.user_id}'

        # Join notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave notification group
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        # Handle notification acknowledgments
        try:
            text_data_json = json.loads(text_data)
            notification_type = text_data_json.get('type')
            
            if notification_type == 'mark_read':
                notification_id = text_data_json.get('notification_id')
                await self.mark_notification_read(notification_id)
                
        except json.JSONDecodeError:
            pass

    # Receive notification from group
    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark notification as read"""
        # Assuming there is a Notification model, which we don't have yet in this file's imports
        # But we should at least try to import it or handle it gracefully
        try:
            # Dynamic import to avoid circular imports if any
            from .models import Notification
            notification = Notification.objects.get(id=notification_id, user=self.user)
            notification.is_read = True
            notification.save()
        except (ImportError, Exception):
            # Fail silently if model doesn't exist or other error
            pass
