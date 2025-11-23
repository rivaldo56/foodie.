from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Payments
    path('', views.PaymentListView.as_view(), name='payment-list'),
    path('create/', views.PaymentCreateView.as_view(), name='create-payment'),
    path('<int:pk>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    
    # Stripe endpoints disabled - using M-Pesa only
    # path('create-intent/', views.CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    # path('confirm/', views.ConfirmPaymentView.as_view(), name='confirm-payment'),
    # path('webhooks/stripe/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
    
    # M-Pesa endpoints
    path('mpesa/pay/', views.MpesaPaymentView.as_view(), name='mpesa-payment'),
    path('mpesa/status/<int:mpesa_payment_id>/', views.MpesaStatusView.as_view(), name='mpesa-status'),
    path('mpesa/callback/', views.MpesaCallbackView.as_view(), name='mpesa-callback'),
    
    # Refunds
    path('refunds/', views.RefundListView.as_view(), name='refund-list'),
    path('refunds/create/', views.RefundCreateView.as_view(), name='create-refund'),
    path('refunds/<int:pk>/', views.RefundDetailView.as_view(), name='refund-detail'),
    path('refunds/<int:pk>/process/', views.ProcessRefundView.as_view(), name='process-refund'),
    
    # Chef payouts
    path('payouts/', views.ChefPayoutListView.as_view(), name='payout-list'),
    path('payouts/create/', views.ChefPayoutCreateView.as_view(), name='create-payout'),
    path('payouts/<int:pk>/', views.ChefPayoutDetailView.as_view(), name='payout-detail'),
    path('payouts/<int:pk>/process/', views.ProcessPayoutView.as_view(), name='process-payout'),
]
