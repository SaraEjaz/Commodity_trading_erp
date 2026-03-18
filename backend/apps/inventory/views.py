from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Stock, StockMovement
from .serializers import StockSerializer, StockMovementSerializer


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Stock.objects.all().order_by('-updated_at')

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        threshold = request.query_params.get('threshold', 100)
        stocks = Stock.objects.filter(quantity__lt=threshold)
        serializer = self.get_serializer(stocks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        stocks = Stock.objects.all()
        stats = {
            'total_items': stocks.count(),
            'total_value': sum(s.quantity * s.unit_cost for s in stocks),
            'low_stock_items': stocks.filter(quantity__lt=100).count(),
        }
        return Response(stats)


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StockMovement.objects.all().order_by('-created_at')
