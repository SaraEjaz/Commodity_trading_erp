from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Commodity, PriceHistory
from .serializers import CommoditySerializer, PriceHistorySerializer


class CommodityViewSet(viewsets.ModelViewSet):
    queryset = Commodity.objects.all()
    serializer_class = CommoditySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Commodity.objects.all().order_by('-created_at')

    @action(detail=True, methods=['get'])
    def price_history(self, request, pk=None):
        commodity = self.get_object()
        prices = PriceHistory.objects.filter(commodity=commodity).order_by('-timestamp')[:30]
        serializer = PriceHistorySerializer(prices, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        commodities = Commodity.objects.all()
        stats = {
            'total_commodities': commodities.count(),
            'active_commodities': commodities.filter(is_active=True).count(),
            'total_base_value': sum((c.base_price or 0) for c in commodities),
        }
        return Response(stats)


class PriceHistoryViewSet(viewsets.ModelViewSet):
    queryset = PriceHistory.objects.all()
    serializer_class = PriceHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        commodity_id = self.request.query_params.get('commodity_id')
        queryset = PriceHistory.objects.all().order_by('-timestamp')
        if commodity_id:
            queryset = queryset.filter(commodity_id=commodity_id)
        return queryset
