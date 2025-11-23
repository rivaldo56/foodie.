from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse
import json
from .models import Payment, Refund, ChefPayout, MpesaPayment
from .serializers import PaymentSerializer, RefundSerializer, ChefPayoutSerializer
from .services import PaymentProcessingService, WebhookService
from .mpesa_service import MpesaPaymentService


class PaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(client=self.request.user)


class PaymentCreateView(generics.CreateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]


class PaymentDetailView(generics.RetrieveAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(client=self.request.user)


# Stripe payment intent disabled - using M-Pesa only
# class CreatePaymentIntentView(generics.CreateAPIView):
#     permission_classes = [permissions.IsAuthenticated]
#     
#     def post(self, request, *args, **kwargs):
#         booking_id = request.data.get('booking_id')
#         payment_method_id = request.data.get('payment_method_id')
#         
#         if not booking_id:
#             return Response(
#                 {'error': 'booking_id is required'}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#         
#         result = PaymentProcessingService.process_booking_payment(
#             booking_id=booking_id,
#             payment_method_id=payment_method_id
#         )
#         
#         if result['success']:
#             return Response(result, status=status.HTTP_201_CREATED)
#         else:
#             return Response(result, status=status.HTTP_400_BAD_REQUEST)


class ConfirmPaymentView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        payment_intent_id = request.data.get('payment_intent_id')
        
        if not payment_intent_id:
            return Response(
                {'error': 'payment_intent_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # This would be used for additional payment confirmation if needed
        return Response({'message': 'Payment confirmation handled automatically'})


class RefundListView(generics.ListAPIView):
    serializer_class = RefundSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Refund.objects.filter(payment__client=self.request.user)


class RefundCreateView(generics.CreateAPIView):
    serializer_class = RefundSerializer
    permission_classes = [permissions.IsAuthenticated]


class RefundDetailView(generics.RetrieveAPIView):
    serializer_class = RefundSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Refund.objects.filter(payment__client=self.request.user)


class ProcessRefundView(generics.UpdateAPIView):
    serializer_class = RefundSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Refund.objects.all()


class ChefPayoutListView(generics.ListAPIView):
    serializer_class = ChefPayoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ChefPayout.objects.filter(chef=self.request.user)


class ChefPayoutCreateView(generics.CreateAPIView):
    serializer_class = ChefPayoutSerializer
    permission_classes = [permissions.IsAuthenticated]


class ChefPayoutDetailView(generics.RetrieveAPIView):
    serializer_class = ChefPayoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ChefPayout.objects.filter(chef=self.request.user)


class ProcessPayoutView(generics.UpdateAPIView):
    serializer_class = ChefPayoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ChefPayout.objects.all()


# M-Pesa Payment Views
class MpesaPaymentView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        booking_id = request.data.get('booking_id')
        phone_number = request.data.get('phone_number')
        
        if not booking_id or not phone_number:
            return Response(
                {'error': 'booking_id and phone_number are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mpesa_service = MpesaPaymentService()
        result = mpesa_service.process_booking_payment(booking_id, phone_number)
        
        if result['success']:
            return Response(result, status=status.HTTP_201_CREATED)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)


class MpesaStatusView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, mpesa_payment_id, *args, **kwargs):
        mpesa_service = MpesaPaymentService()
        result = mpesa_service.check_payment_status(mpesa_payment_id)
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class MpesaCallbackView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        try:
            callback_data = json.loads(request.body)
            mpesa_service = MpesaPaymentService()
            result = mpesa_service.handle_callback(callback_data)
            
            return HttpResponse("OK", status=200)
        except Exception as e:
            return HttpResponse("Error", status=400)


# Stripe webhook disabled - using M-Pesa only
# @method_decorator(csrf_exempt, name='dispatch')
# class StripeWebhookView(generics.CreateAPIView):
#     permission_classes = [permissions.AllowAny]
#     
#     def post(self, request, *args, **kwargs):
#         payload = request.body
#         sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
#         
#         result = WebhookService.handle_stripe_webhook(payload, sig_header)
#         
#         if result['success']:
#             return HttpResponse("OK", status=200)
#         else:
#             return HttpResponse("Error", status=400)
