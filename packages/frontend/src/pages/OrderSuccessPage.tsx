import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, Button, Chip, Divider, Alert } from '@mui/material';
import { CheckCircle, Receipt, ShoppingBag } from '@mui/icons-material';
import { api } from '../api/client';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (id) api.getOrder(id).then(setOrder).catch(() => {});
  }, [id]);

  return (
    <Container sx={{ py: 6, maxWidth: 'md' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircle sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>Order Placed Successfully!</Typography>
        <Typography color="text.secondary">Thank you for your purchase. Your order has been confirmed.</Typography>
      </Box>

      {order && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>Order #{order.id.slice(0, 8)}</Typography>
            <Chip label={order.status} color="warning" sx={{ textTransform: 'capitalize' }} />
          </Box>
          <Divider sx={{ mb: 2 }} />

          {order.items?.map((item: any) => (
            <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1.5 }}>
              <Box component="img" src={item.product_image} alt={item.product_name}
                sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>{item.product_name}</Typography>
                <Typography variant="caption" color="text.secondary">Qty: {item.quantity} x ${item.price.toFixed(2)}</Typography>
              </Box>
              <Typography fontWeight={600}>${item.total.toFixed(2)}</Typography>
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography color="text.secondary">Subtotal</Typography>
            <Typography>${order.subtotal.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography color="text.secondary">Tax</Typography>
            <Typography>${order.tax.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography color="text.secondary">Shipping</Typography>
            <Typography>{order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight={700}>Total</Typography>
            <Typography variant="h6" fontWeight={700} color="primary.main">${order.total.toFixed(2)}</Typography>
          </Box>

          {order.shipping_line1 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Shipping to:</Typography>
              <Typography variant="body2">{order.shipping_name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {order.shipping_line1}{order.shipping_line2 ? `, ${order.shipping_line2}` : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        A confirmation email would be sent in production. This is a demo application.
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="contained" startIcon={<Receipt />} onClick={() => navigate('/orders')}>
          View All Orders
        </Button>
        <Button variant="outlined" startIcon={<ShoppingBag />} onClick={() => navigate('/catalog')}>
          Continue Shopping
        </Button>
      </Box>
    </Container>
  );
}
