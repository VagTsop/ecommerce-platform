import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, IconButton, Button, Divider, TextField, Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Add, Remove, Delete, ShoppingBag, LocalOffer } from '@mui/icons-material';
import { useCartStore } from '../stores/cartStore';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, subtotal, itemCount, updateQuantity, removeItem } = useCartStore();
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  const applyCoupon = () => {
    setCouponError('');
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    if (code === 'WELCOME10' && subtotal >= 50) {
      setCouponApplied({ code, discount: Math.round(subtotal * 0.1 * 100) / 100 });
    } else if (code === 'SAVE20' && subtotal >= 100) {
      setCouponApplied({ code, discount: 20 });
    } else {
      setCouponError('Invalid coupon or minimum order not met');
    }
  };

  const discount = couponApplied?.discount || 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = afterDiscount >= 100 ? 0 : 9.99;
  const tax = Math.round(afterDiscount * 0.08 * 100) / 100;
  const total = Math.round((afterDiscount + tax + shipping) * 100) / 100;

  if (items.length === 0) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <ShoppingBag sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>Your cart is empty</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Add some products to get started!</Typography>
        <Button variant="contained" onClick={() => navigate('/catalog')}>Browse Products</Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Shopping Cart ({itemCount} items)</Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {items.map(item => {
            const images = JSON.parse(item.images || '[]');
            return (
              <Paper key={item.id} sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box component="img" src={images[0]} alt={item.name}
                  sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 2, cursor: 'pointer' }}
                  onClick={() => navigate(`/product/${item.slug}`)} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    onClick={() => navigate(`/product/${item.slug}`)}>{item.name}</Typography>
                  <Typography variant="body2" color="text.secondary">${item.price.toFixed(2)} each</Typography>
                  {item.compare_price && (
                    <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>${item.compare_price.toFixed(2)}</Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <IconButton size="small" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}><Remove fontSize="small" /></IconButton>
                  <Typography sx={{ px: 1.5, fontWeight: 600, minWidth: 30, textAlign: 'center' }}>{item.quantity}</Typography>
                  <IconButton size="small" onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}><Add fontSize="small" /></IconButton>
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 80, textAlign: 'right' }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Typography>
                <IconButton color="error" onClick={() => removeItem(item.id)}><Delete /></IconButton>
              </Paper>
            );
          })}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Order Summary</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography fontWeight={500}>${subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Shipping</Typography>
              <Typography fontWeight={500}>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Tax (8%)</Typography>
              <Typography fontWeight={500}>${tax.toFixed(2)}</Typography>
            </Box>
            {subtotal < 100 && (
              <Typography variant="caption" color="primary.main" sx={{ display: 'block', mb: 1 }}>
                Add ${(100 - subtotal).toFixed(2)} more for free shipping!
              </Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>Total</Typography>
              <Typography variant="h6" fontWeight={700} color="primary.main">${total.toFixed(2)}</Typography>
            </Box>

            {couponApplied && (
              <Alert severity="success" sx={{ mb: 1 }} onClose={() => { setCouponApplied(null); setCoupon(''); }}>
                <strong>{couponApplied.code}</strong> applied! You save ${couponApplied.discount.toFixed(2)}
              </Alert>
            )}
            {couponError && <Alert severity="error" sx={{ mb: 1 }}>{couponError}</Alert>}
            {!couponApplied && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField fullWidth size="small" label="Coupon Code" value={coupon}
                  onChange={(e) => setCoupon(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                  placeholder="e.g. WELCOME10" />
                <Button variant="outlined" onClick={applyCoupon} startIcon={<LocalOffer />} sx={{ whiteSpace: 'nowrap' }}>
                  Apply
                </Button>
              </Box>
            )}
            {discount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="success.main">Discount</Typography>
                <Typography fontWeight={500} color="success.main">-${discount.toFixed(2)}</Typography>
              </Box>
            )}

            <Button variant="contained" fullWidth size="large" onClick={() => navigate('/checkout')} sx={{ py: 1.5 }}>
              Proceed to Checkout
            </Button>
            <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate('/catalog')}>Continue Shopping</Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
