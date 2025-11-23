"""
Chatbot API Views
Handles conversational AI interactions
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from .chatbot import FoodieChatbot
from .models import ChatSession, ChatMessage
from .serializers import ChatMessageSerializer


class ChatbotMessageView(generics.CreateAPIView):
    """Send message to AI chatbot and get response"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user_message = request.data.get('message', '')
        session_id = request.data.get('session_id')
        
        if not user_message:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create chat session
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=request.user)
            except ChatSession.DoesNotExist:
                session = ChatSession.objects.create(
                    user=request.user,
                    session_type='booking_assistance'
                )
        else:
            session = ChatSession.objects.create(
                user=request.user,
                session_type='booking_assistance'
            )
        
        # Save user message
        user_msg = ChatMessage.objects.create(
            session=session,
            role='user',
            content=user_message
        )
        
        # Get user context
        context = {
            'user_id': request.user.id,
            'user_name': request.user.full_name,
            'previous_bookings': request.user.bookings.count() if hasattr(request.user, 'bookings') else 0,
        }
        
        # Get chatbot response
        chatbot = FoodieChatbot()
        result = chatbot.chat(user_message, context=context)
        
        if result['success']:
            # Save AI response
            ai_msg = ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=result['response'],
                metadata={
                    'intent': result.get('intent'),
                    'booking_data': result.get('booking_data')
                }
            )
            
            return Response({
                'session_id': session.id,
                'message': result['response'],
                'intent': result.get('intent'),
                'booking_data': result.get('booking_data'),
                'message_id': ai_msg.id
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': result.get('error', 'Failed to get response')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MealRecommendationView(generics.CreateAPIView):
    """Get AI-powered meal recommendations"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        dietary_requirements = request.data.get('dietary_requirements', [])
        cuisine_preference = request.data.get('cuisine_preference')
        budget = request.data.get('budget')
        
        chatbot = FoodieChatbot()
        result = chatbot.get_meal_recommendations(
            dietary_requirements=dietary_requirements,
            cuisine_preference=cuisine_preference,
            budget=budget
        )
        
        if result['success']:
            return Response({
                'recommendations': result['recommendations'],
                'menu_items': result.get('menu_items', [])
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': result.get('error', 'Failed to get recommendations')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChefRecommendationAIView(generics.CreateAPIView):
    """Get AI-powered chef recommendations"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        service_type = request.data.get('service_type')
        location = request.data.get('location')
        budget = request.data.get('budget')
        cuisine = request.data.get('cuisine')
        
        chatbot = FoodieChatbot()
        result = chatbot.get_chef_recommendations(
            service_type=service_type,
            location=location,
            budget=budget,
            cuisine=cuisine
        )
        
        if result['success']:
            return Response({
                'recommendations': result['recommendations'],
                'chefs': result.get('chefs', [])
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': result.get('error', 'Failed to get recommendations')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DietaryAnalysisView(generics.CreateAPIView):
    """Analyze dietary needs and provide insights"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user_input = request.data.get('input', '')
        
        if not user_input:
            return Response(
                {'error': 'Input is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        chatbot = FoodieChatbot()
        result = chatbot.analyze_dietary_needs(user_input)
        
        if result['success']:
            return Response({
                'analysis': result['analysis']
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': result.get('error', 'Failed to analyze dietary needs')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
