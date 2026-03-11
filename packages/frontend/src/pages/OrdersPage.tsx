import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, Chip, Divider, Skeleton, Button } from '@mui/material';
import { Receipt } from '@mui/icons-material';
import { api } from '../api/client';

const statusColors: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  pending: 'warning', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'error',
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getOrders().then(setOrders).finally(() => setLoading(false)); }, []);

  if (loading) return <Container sx={{ py: 4 }}>{Array(3).fill(0).map((_, i) => <Skeleton key={i} height={120} sx={{ mb: 2 }} />)}</Container>;

  if (orders.length === 0) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>No orders yet</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Your order history will appear here</Typography>
        <Button variant="contained" onClick={() => navigate('/catalog')}>Start Shopping</Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>My Orders</Typography>
      {orders.map(order => (
        <Paper key={order.id} sx={{ p: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Order #{order.id.slice(0, 8)}</Typography>
              <Typography variant="caption" color="text.secondary">{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={order.status} color={statusColors[order.status] || 'default'} size="small" sx={{ textTransform: 'capitalize' }} />
              <Typography variant="h6" fontWeight={700} color="primary.main">${order.total.toFixed(2)}</Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {order.items?.map((item: any) => (
            <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1.5 }}>
              <Box component="img" src={item.product_image} alt={item.product_name}
                sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>{item.product_name}</Typography>
                <Typography variant="caption" color="text.secondary">Qty: {item.quantity} x ${item.price.toFixed(2)}</Typography>
              </Box>
              <Typography variant="body2" fontWeight={600}>${item.total.toFixed(2)}</Typography>
            </Box>
          ))}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              {order.shipping_line1 && (
                <Typography variant="caption" color="text.secondary">
                  Shipped to: {order.shipping_name}, {order.shipping_city} {order.shipping_state}
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Subtotal: ${order.subtotal.toFixed(2)} | Tax: ${order.tax.toFixed(2)} | Shipping: {order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}
              </Typography>
            </Box>
          </Box>
        </Paper>
      ))}
    </Container>
  );
}
