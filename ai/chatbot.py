"""
AI Chatbot Service for Foodie v2
Provides conversational booking assistance and meal recommendations
"""
import google.generativeai as genai
from django.conf import settings
from bookings.models import MenuItem
from chefs.models import ChefProfile
import json


class FoodieChatbot:
    """AI Chatbot for booking assistance and recommendations"""
    
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        self.conversation_history = []
    
    def get_system_prompt(self):
        """System prompt defining chatbot behavior"""
        return """You are Foodie AI, a helpful assistant for the Foodie platform - a service that connects clients with private chefs in Nairobi, Kenya.

Your role is to:
1. Help clients find the perfect chef for their needs
2. Recommend meals based on dietary requirements and preferences
3. Assist with booking creation by gathering necessary information
4. Answer questions about chefs, menus, and the booking process

Guidelines:
- Be friendly, professional, and enthusiastic about food
- Ask clarifying questions when needed
- Provide specific recommendations based on user preferences
- When helping with bookings, gather: service type, date/time, number of guests, location, dietary requirements
- Use Kenyan context (mention Nairobi neighborhoods, local cuisine, etc.)
- Keep responses concise but informative

Available service types:
- Personal Meal: Intimate dining experience at home
- Event Catering: Catering for parties and events
- Cooking Class: Learn to cook with a professional chef
- Meal Prep: Weekly meal preparation service

Common dietary requirements: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Halal, Kosher, Low-Carb, Keto

Always be helpful and guide users toward making a booking!"""
    
    def chat(self, user_message, context=None):
        """
        Process user message and generate response
        
        Args:
            user_message: User's message
            context: Optional context (user preferences, previous bookings, etc.)
        
        Returns:
            dict with response and any extracted booking data
        """
        try:
            # Build conversation context
            messages = [self.get_system_prompt()]
            
            # Add context if provided
            if context:
                context_str = f"\nUser Context:\n{json.dumps(context, indent=2)}"
                messages.append(context_str)
            
            # Add conversation history
            for msg in self.conversation_history[-10:]:  # Last 10 messages
                messages.append(f"{msg['role']}: {msg['content']}")
            
            # Add current message
            messages.append(f"User: {user_message}")
            
            # Generate response
            full_prompt = "\n\n".join(messages)
            response = self.model.generate_content(full_prompt)
            
            ai_response = response.text
            
            # Update conversation history
            self.conversation_history.append({
                'role': 'User',
                'content': user_message
            })
            self.conversation_history.append({
                'role': 'Assistant',
                'content': ai_response
            })
            
            # Extract booking intent
            booking_data = self._extract_booking_data(user_message, ai_response)
            
            return {
                'success': True,
                'response': ai_response,
                'booking_data': booking_data,
                'intent': self._detect_intent(user_message)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "I'm sorry, I'm having trouble processing your request. Please try again."
            }
    
    def _detect_intent(self, message):
        """Detect user intent from message"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['book', 'booking', 'reserve', 'schedule']):
            return 'booking'
        elif any(word in message_lower for word in ['recommend', 'suggest', 'what should', 'help me find']):
            return 'recommendation'
        elif any(word in message_lower for word in ['menu', 'meal', 'dish', 'food']):
            return 'menu_inquiry'
        elif any(word in message_lower for word in ['chef', 'cook', 'who']):
            return 'chef_inquiry'
        else:
            return 'general'
    
    def _extract_booking_data(self, user_message, ai_response):
        """Extract structured booking data from conversation"""
        # This is a simplified version - in production, use more sophisticated NLP
        booking_data = {}
        message_lower = user_message.lower()
        
        # Extract service type
        if 'personal meal' in message_lower or 'dinner' in message_lower:
            booking_data['service_type'] = 'personal_meal'
        elif 'catering' in message_lower or 'event' in message_lower or 'party' in message_lower:
            booking_data['service_type'] = 'event_catering'
        elif 'cooking class' in message_lower or 'learn' in message_lower:
            booking_data['service_type'] = 'cooking_class'
        elif 'meal prep' in message_lower:
            booking_data['service_type'] = 'meal_prep'
        
        # Extract number of guests (simple regex would be better)
        import re
        guest_match = re.search(r'(\d+)\s*(people|guests|persons)', message_lower)
        if guest_match:
            booking_data['number_of_guests'] = int(guest_match.group(1))
        
        # Extract dietary requirements
        dietary = []
        if 'vegetarian' in message_lower:
            dietary.append('Vegetarian')
        if 'vegan' in message_lower:
            dietary.append('Vegan')
        if 'gluten-free' in message_lower or 'gluten free' in message_lower:
            dietary.append('Gluten-Free')
        if 'halal' in message_lower:
            dietary.append('Halal')
        if dietary:
            booking_data['dietary_requirements'] = dietary
        
        return booking_data if booking_data else None
    
    def get_meal_recommendations(self, dietary_requirements=None, cuisine_preference=None, budget=None):
        """Get AI-powered meal recommendations"""
        try:
            # Get available menu items
            menu_items = MenuItem.objects.filter(is_available=True)
            
            # Filter by dietary requirements
            if dietary_requirements:
                if 'Vegetarian' in dietary_requirements:
                    menu_items = menu_items.filter(is_vegetarian=True)
                if 'Vegan' in dietary_requirements:
                    menu_items = menu_items.filter(is_vegan=True)
                if 'Gluten-Free' in dietary_requirements:
                    menu_items = menu_items.filter(is_gluten_free=True)
            
            # Build prompt
            menu_list = "\n".join([
                f"- {item.name} (KSh {item.price_per_serving}) - {item.description}"
                for item in menu_items[:20]  # Limit to 20 items
            ])
            
            prompt = f"""Based on the following criteria, recommend the best meals:

Dietary Requirements: {', '.join(dietary_requirements) if dietary_requirements else 'None'}
Cuisine Preference: {cuisine_preference or 'Any'}
Budget per serving: {budget or 'Flexible'}

Available meals:
{menu_list}

Provide 3-5 specific meal recommendations with brief explanations of why each is a good fit."""
            
            response = self.model.generate_content(prompt)
            
            return {
                'success': True,
                'recommendations': response.text,
                'menu_items': list(menu_items.values('id', 'name', 'price_per_serving', 'description')[:5])
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_chef_recommendations(self, service_type=None, location=None, budget=None, cuisine=None):
        """Get AI-powered chef recommendations"""
        try:
            # Get available chefs
            chefs = ChefProfile.objects.filter(is_available=True, is_verified=True)
            
            # Filter by specialties if cuisine specified
            if cuisine:
                chefs = chefs.filter(specialties__contains=[cuisine])
            
            # Build prompt
            chef_list = "\n".join([
                f"- {chef.user.full_name}: {chef.experience_level}, {', '.join(chef.specialties[:3])}, "
                f"KSh {chef.hourly_rate}/hr, Rating: {chef.average_rating}/5"
                for chef in chefs[:10]
            ])
            
            prompt = f"""Based on the following criteria, recommend the best chefs:

Service Type: {service_type or 'Any'}
Location: {location or 'Nairobi'}
Budget: {budget or 'Flexible'}
Cuisine Preference: {cuisine or 'Any'}

Available chefs:
{chef_list}

Provide 3 specific chef recommendations with brief explanations of why each is a good fit for the client's needs."""
            
            response = self.model.generate_content(prompt)
            
            return {
                'success': True,
                'recommendations': response.text,
                'chefs': list(chefs.values('id', 'user__full_name', 'specialties', 'hourly_rate', 'average_rating')[:3])
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def analyze_dietary_needs(self, user_input):
        """Analyze and provide insights on dietary needs"""
        try:
            prompt = f"""A user has mentioned the following dietary needs or preferences:

"{user_input}"

Provide:
1. A summary of their dietary requirements
2. Suggestions for suitable cuisines
3. Any important considerations for chefs
4. Recommended meal types

Keep the response concise and practical."""
            
            response = self.model.generate_content(prompt)
            
            return {
                'success': True,
                'analysis': response.text
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
