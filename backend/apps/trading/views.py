from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Trade, TradePosition
from .serializers import TradeSerializer, TradePositionSerializer


class TradeViewSet(viewsets.ModelViewSet):
    queryset = Trade.objects.all()
    serializer_class = TradeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Trade.objects.filter(trader=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def active_trades(self, request):
        trades = Trade.objects.filter(
            trader=request.user,
            status__in=['pending', 'confirmed', 'on_hold'],
        )
        serializer = self.get_serializer(trades, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def close_trade(self, request, pk=None):
        trade = self.get_object()
        trade.status = 'cancelled'
        trade.save()
        return Response({'status': 'trade cancelled'})


class TradePositionViewSet(viewsets.ModelViewSet):
    queryset = TradePosition.objects.all()
    serializer_class = TradePositionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TradePosition.objects.filter(trader=self.request.user).order_by('-created_at')
