from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.users.views import UserViewSet

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Backwards-compatible aliases (docs/frontend may use these)
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh_alias'),
    path('api/auth/register/', UserViewSet.as_view({'post': 'create'}), name='auth_register'),
    
    path('api/users/', include('apps.users.urls')),
    path('api/commodities/', include('apps.commodities.urls')),
    path('api/trading/', include('apps.trading.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/settlements/', include('apps.settlements.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
