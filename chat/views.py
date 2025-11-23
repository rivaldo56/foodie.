from rest_framework import generics, status, permissions
from rest_framework.response import Response
from .models import ChatRoom, Message, MessageReadStatus
from .serializers import ChatRoomSerializer, MessageSerializer, MessageCreateSerializer, ChatRoomCreateSerializer


class ChatRoomListView(generics.ListAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(client=user) | ChatRoom.objects.filter(chef=user)


class ChatRoomCreateView(generics.CreateAPIView):
    serializer_class = ChatRoomCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        chat_room = serializer.save()
        
        # Return full chat room details including ID
        output_serializer = ChatRoomSerializer(chat_room, context={'request': request})
        headers = self.get_success_headers(output_serializer.data)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ChatRoomDetailView(generics.RetrieveAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(client=user) | ChatRoom.objects.filter(chef=user)


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        room_id = self.kwargs['room_id']
        return Message.objects.filter(chat_room_id=room_id)


class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


class MessageDetailView(generics.RetrieveAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Message.objects.all()


class MessageUpdateView(generics.UpdateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Message.objects.filter(sender=self.request.user)


class MessageDeleteView(generics.UpdateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Message.objects.filter(sender=self.request.user)


class MessageMarkReadView(generics.UpdateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Message.objects.all()


class MarkAllMessagesReadView(generics.UpdateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Message.objects.all()
