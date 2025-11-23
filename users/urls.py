from django.urls import path
from . import views
from . import admin_views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # Profile management
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('client-profile/', views.ClientProfileView.as_view(), name='client-profile'),
    path('change-password/', views.PasswordChangeView.as_view(), name='change-password'),
    
    # Dashboard
    path('dashboard/', views.user_dashboard, name='dashboard'),
    
    # Admin Panel
    path('admin/dashboard/', admin_views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/users/', admin_views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:user_id>/', admin_views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/chefs/verification/', admin_views.AdminChefVerificationView.as_view(), name='admin-chef-verification'),
    path('admin/chefs/<int:chef_id>/verify/', admin_views.AdminChefVerificationView.as_view(), name='admin-verify-chef'),
    path('admin/bookings/', admin_views.AdminBookingOversightView.as_view(), name='admin-bookings'),
]
