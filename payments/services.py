import stripe
import logging
from decimal import Decimal
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Payment, Refund, ChefPayout
from bookings.models import Booking

User = get_user_model()
logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripePaymentService:
    """Service class for handling Stripe payments"""
    
    @staticmethod
    def create_payment_intent(amount, currency='usd', metadata=None):
        """Create a Stripe payment intent"""
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency,
                metadata=metadata or {},
                automatic_payment_methods={'enabled': True},
            )
            return {
                'success': True,
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe payment intent creation failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    @staticmethod
    def confirm_payment(payment_intent_id, payment_method_id=None):
        """Confirm a Stripe payment intent"""
        try:
            if payment_method_id:
                intent = stripe.PaymentIntent.confirm(
                    payment_intent_id,
                    payment_method=payment_method_id
                )
            else:
                intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                'success': True,
                'status': intent.status,
                'payment_intent': intent
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe payment confirmation failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    @staticmethod
    def create_customer(user):
        """Create a Stripe customer"""
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=f"{user.first_name} {user.last_name}",
                metadata={'user_id': user.id}
            )
            return {
                'success': True,
                'customer_id': customer.id
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe customer creation failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    @staticmethod
    def create_refund(payment_intent_id, amount=None, reason=None):
        """Create a refund for a payment"""
        try:
            refund_data = {'payment_intent': payment_intent_id}
            
            if amount:
                refund_data['amount'] = int(amount * 100)  # Convert to cents
            
            if reason:
                refund_data['reason'] = reason
            
            refund = stripe.Refund.create(**refund_data)
            
            return {
                'success': True,
                'refund_id': refund.id,
                'status': refund.status,
                'amount': refund.amount / 100  # Convert back to dollars
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe refund creation failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    @staticmethod
    def create_payout(chef, amount, currency='usd'):
        """Create a payout to chef's connected account"""
        try:
            # This assumes chef has a connected Stripe account
            # In real implementation, you'd need to handle Stripe Connect
            payout = stripe.Payout.create(
                amount=int(amount * 100),
                currency=currency,
                stripe_account=chef.stripe_account_id  # This field needs to be added to chef model
            )
            
            return {
                'success': True,
                'payout_id': payout.id,
                'status': payout.status
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe payout creation failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


class PaymentProcessingService:
    """Service class for processing payments and managing payment lifecycle"""
    
    @staticmethod
    def process_booking_payment(booking_id, payment_method_id, save_payment_method=False):
        """Process payment for a booking"""
        try:
            booking = Booking.objects.get(id=booking_id)
            
            # Calculate total amount including platform fee
            subtotal = booking.total_amount
            platform_fee = subtotal * Decimal('0.05')  # 5% platform fee
            total_amount = subtotal + platform_fee
            
            # Create payment intent
            metadata = {
                'booking_id': booking.id,
                'client_id': booking.client.id,
                'chef_id': booking.chef.id,
                'subtotal': str(subtotal),
                'platform_fee': str(platform_fee)
            }
            
            intent_result = StripePaymentService.create_payment_intent(
                amount=total_amount,
                metadata=metadata
            )
            
            if not intent_result['success']:
                return intent_result
            
            # Create payment record
            payment = Payment.objects.create(
                booking=booking,
                client=booking.client,
                amount=total_amount,
                platform_fee=platform_fee,
                stripe_payment_intent_id=intent_result['payment_intent_id'],
                status='pending'
            )
            
            # Confirm payment
            confirm_result = StripePaymentService.confirm_payment(
                intent_result['payment_intent_id'],
                payment_method_id
            )
            
            if confirm_result['success'] and confirm_result['status'] == 'succeeded':
                payment.status = 'completed'
                payment.save()
                
                # Update booking status
                booking.status = 'confirmed'
                booking.save()
                
                # Create chef payout record (to be processed later)
                chef_amount = subtotal * Decimal('0.95')  # 95% to chef (5% platform fee)
                ChefPayout.objects.create(
                    chef=booking.chef.user,
                    booking=booking,
                    payment=payment,
                    amount=chef_amount,
                    status='pending'
                )
                
                return {
                    'success': True,
                    'payment_id': payment.id,
                    'booking_id': booking.id,
                    'amount': total_amount
                }
            else:
                payment.status = 'failed'
                payment.save()
                return {
                    'success': False,
                    'error': 'Payment confirmation failed'
                }
                
        except Booking.DoesNotExist:
            return {
                'success': False,
                'error': 'Booking not found'
            }
        except Exception as e:
            logger.error(f"Payment processing failed: {str(e)}")
            return {
                'success': False,
                'error': 'Payment processing failed'
            }

    @staticmethod
    def process_refund(payment_id, amount=None, reason=None):
        """Process a refund for a payment"""
        try:
            payment = Payment.objects.get(id=payment_id)
            
            if payment.status != 'completed':
                return {
                    'success': False,
                    'error': 'Can only refund completed payments'
                }
            
            # Create refund with Stripe
            refund_result = StripePaymentService.create_refund(
                payment.stripe_payment_intent_id,
                amount=amount,
                reason=reason
            )
            
            if refund_result['success']:
                # Create refund record
                refund = Refund.objects.create(
                    payment=payment,
                    amount=amount or payment.amount,
                    reason=reason or 'requested_by_customer',
                    stripe_refund_id=refund_result['refund_id'],
                    status='completed'
                )
                
                # Update payment status
                if amount and amount < payment.amount:
                    payment.status = 'partially_refunded'
                else:
                    payment.status = 'refunded'
                payment.save()
                
                # Update booking status
                payment.booking.payment_status = 'refunded'
                payment.booking.status = 'cancelled'
                payment.booking.save()
                
                return {
                    'success': True,
                    'refund_id': refund.id,
                    'amount': refund.amount
                }
            else:
                return refund_result
                
        except Payment.DoesNotExist:
            return {
                'success': False,
                'error': 'Payment not found'
            }
        except Exception as e:
            logger.error(f"Refund processing failed: {str(e)}")
            return {
                'success': False,
                'error': 'Refund processing failed'
            }

    @staticmethod
    def process_chef_payout(payout_id):
        """Process payout to chef"""
        try:
            payout = ChefPayout.objects.get(id=payout_id)
            
            if payout.status != 'pending':
                return {
                    'success': False,
                    'error': 'Payout already processed'
                }
            
            # Create payout with Stripe
            payout_result = StripePaymentService.create_payout(
                payout.chef,
                payout.amount
            )
            
            if payout_result['success']:
                payout.stripe_payout_id = payout_result['payout_id']
                payout.status = 'completed'
                payout.save()
                
                return {
                    'success': True,
                    'payout_id': payout.id,
                    'amount': payout.amount
                }
            else:
                payout.status = 'failed'
                payout.save()
                return payout_result
                
        except ChefPayout.DoesNotExist:
            return {
                'success': False,
                'error': 'Payout not found'
            }
        except Exception as e:
            logger.error(f"Payout processing failed: {str(e)}")
            return {
                'success': False,
                'error': 'Payout processing failed'
            }


class WebhookService:
    """Service for handling payment webhooks"""
    
    @staticmethod
    def handle_stripe_webhook(payload, sig_header):
        """Handle Stripe webhook events"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            logger.error("Invalid payload in Stripe webhook")
            return {'success': False, 'error': 'Invalid payload'}
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid signature in Stripe webhook")
            return {'success': False, 'error': 'Invalid signature'}

        # Handle the event
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            WebhookService._handle_payment_success(payment_intent)
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            WebhookService._handle_payment_failure(payment_intent)
        elif event['type'] == 'refund.created':
            refund = event['data']['object']
            WebhookService._handle_refund_created(refund)
        else:
            logger.info(f"Unhandled Stripe webhook event type: {event['type']}")

        return {'success': True}

    @staticmethod
    def _handle_payment_success(payment_intent):
        """Handle successful payment"""
        try:
            payment = Payment.objects.get(
                stripe_payment_intent_id=payment_intent['id']
            )
            payment.status = 'completed'
            payment.save()
            
            # Update booking
            payment.booking.payment_status = 'paid'
            payment.booking.status = 'confirmed'
            payment.booking.save()
            
            logger.info(f"Payment {payment.id} marked as completed")
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for intent {payment_intent['id']}")

    @staticmethod
    def _handle_payment_failure(payment_intent):
        """Handle failed payment"""
        try:
            payment = Payment.objects.get(
                stripe_payment_intent_id=payment_intent['id']
            )
            payment.status = 'failed'
            payment.save()
            
            # Update booking
            payment.booking.payment_status = 'failed'
            payment.booking.save()
            
            logger.info(f"Payment {payment.id} marked as failed")
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for intent {payment_intent['id']}")

    @staticmethod
    def _handle_refund_created(refund):
        """Handle refund creation"""
        try:
            payment = Payment.objects.get(
                stripe_payment_intent_id=refund['payment_intent']
            )
            
            # Update or create refund record
            refund_obj, created = Refund.objects.get_or_create(
                stripe_refund_id=refund['id'],
                defaults={
                    'payment': payment,
                    'amount': Decimal(refund['amount']) / 100,
                    'status': 'completed'
                }
            )
            
            if not created:
                refund_obj.status = 'completed'
                refund_obj.save()
            
            logger.info(f"Refund {refund_obj.id} processed")
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for refund {refund['id']}")
