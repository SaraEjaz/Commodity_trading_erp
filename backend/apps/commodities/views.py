from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Commodity, CommodityPrice
from .serializers import CommoditySerializer, CommodityPriceSerializer


class CommodityViewSet(viewsets.ModelViewSet):
    queryset = Commodity.objects.all()
    serializer_class = CommoditySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Commodity.objects.all().order_by('-created_at')

    @action(detail=True, methods=['get'])
    def price_history(self, request, pk=None):
        commodity = self.get_object()
        prices = CommodityPrice.objects.filter(commodity=commodity).order_by('-date')[:30]
        serializer = CommodityPriceSerializer(prices, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        commodities = Commodity.objects.all()
        stats = {
            'total_commodities': commodities.count(),
            'active_commodities': commodities.filter(is_active=True).count(),
            'total_value': sum(c.current_price * c.quantity for c in commodities),
        }
        return Response(stats)


class CommodityPriceViewSet(viewsets.ModelViewSet):
    queryset = CommodityPrice.objects.all()
    serializer_class = CommodityPriceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        commodity_id = self.request.query_params.get('commodity_id')
        queryset = CommodityPrice.objects.all().order_by('-date')
        if commodity_id:
            queryset = queryset.filter(commodity_id=commodity_id)
        return queryset
