"""
URL configuration for chefconnect project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# API Documentation Schema
schema_view = get_schema_view(
    openapi.Info(
        title="ChefConnect API",
        default_version='v1',
        description="API for ChefConnect - Connect with professional chefs",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@chefconnect.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_root(request):
    """
    Welcome to ChefConnect API
    """
    return Response({
        'message': 'Welcome to ChefConnect API',
        'version': 'v1',
        'documentation': {
            'swagger': request.build_absolute_uri('/swagger/'),
            'redoc': request.build_absolute_uri('/redoc/'),
        },
        'endpoints': {
            'users': request.build_absolute_uri('/api/users/'),
            'chefs': request.build_absolute_uri('/api/chefs/'),
            'bookings': request.build_absolute_uri('/api/bookings/'),
            'chat': request.build_absolute_uri('/api/chat/'),
            'payments': request.build_absolute_uri('/api/payments/'),
            'ai': request.build_absolute_uri('/api/ai/'),
        },
        'admin': request.build_absolute_uri('/admin/'),
    })

urlpatterns = [
    # Root API endpoint
    path('', api_root, name='api-root'),
    path('api/', api_root, name='api-root-alt'),
    
    # Admin and documentation
    path('admin/', admin.site.urls),
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API Endpoints
    path('api/users/', include('users.urls')),
    path('api/chefs/', include('chefs.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/ai/', include('ai.urls')),
    path('api/kitchen/', include('kitchen.urls')),
    path('api/recipes/', include('recipes.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
