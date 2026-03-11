import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, TextField, Button, Stepper, Step, StepLabel,
  Divider, Alert, CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ShoppingBag } from '@mui/icons-material';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';

const steps = ['Shipping', 'Review & Pay'];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal } = useCartStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [coupon, setCoupon] = useState('');
  const [shipping, setShipping] = useState({
    name: '', line1: '', line2: '', city: '', state: '', zip: '', country: 'US',
  });

  useEffect(() => {
    api.getMe().then(p => {
      setProfile(p);
      setShipping({
        name: p.name || '', line1: p.address_line1 || '', line2: p.address_line2 || '',
        city: p.city || '', state: p.state || '', zip: p.zip || '', country: p.country || 'US',
      });
    }).catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <ShoppingBag sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>No items to checkout</Typography>
        <Button variant="contained" onClick={() => navigate('/catalog')}>Browse Products</Button>
      </Container>
    );
  }

  const shippingCost = subtotal >= 100 ? 0 : 9.99;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + tax + shippingCost) * 100) / 100;

  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);
    try {
      const order = await api.createOrder({
        shipping_name: shipping.name, shipping_line1: shipping.line1, shipping_line2: shipping.line2,
        shipping_city: shipping.city, shipping_state: shipping.state, shipping_zip: shipping.zip,
        shipping_country: shipping.country, coupon_code: coupon || undefined,
      });
      navigate(`/order-success/${order.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 3, maxWidth: 'md' }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Checkout</Typography>
      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {step === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Shipping Address</Typography>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField fullWidth label="Full Name" value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} required />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Address Line 1" value={shipping.line1} onChange={(e) => setShipping({ ...shipping, line1: e.target.value })} required />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Address Line 2 (Optional)" value={shipping.line2} onChange={(e) => setShipping({ ...shipping, line2: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="State" value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="ZIP Code" value={shipping.zip} onChange={(e) => setShipping({ ...shipping, zip: e.target.value })} required />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" size="large" onClick={() => setStep(1)}
              disabled={!shipping.name || !shipping.line1 || !shipping.city || !shipping.state || !shipping.zip}>
              Continue to Review
            </Button>
          </Box>
        </Paper>
      )}

      {step === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Shipping To</Typography>
              <Typography>{shipping.name}</Typography>
              <Typography color="text.secondary">{shipping.line1}</Typography>
              {shipping.line2 && <Typography color="text.secondary">{shipping.line2}</Typography>}
              <Typography color="text.secondary">{shipping.city}, {shipping.state} {shipping.zip}</Typography>
              <Button size="small" onClick={() => setStep(0)} sx={{ mt: 1 }}>Edit</Button>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Order Items ({items.length})</Typography>
              {items.map(item => {
                const images = JSON.parse(item.images || '[]');
                return (
                  <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                    <Box component="img" src={images[0]} alt={item.name} sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Qty: {item.quantity}</Typography>
                    </Box>
                    <Typography fontWeight={600}>${(item.price * item.quantity).toFixed(2)}</Typography>
                  </Box>
                );
              })}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Payment Summary</Typography>
              <TextField fullWidth size="small" label="Coupon Code" value={coupon} onChange={(e) => setCoupon(e.target.value)} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography>${subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Shipping</Typography>
                <Typography>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Tax</Typography>
                <Typography>${tax.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>Total</Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">${total.toFixed(2)}</Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                This is a demo. No real payment is processed.
              </Alert>

              <Button variant="contained" fullWidth size="large" onClick={handlePlaceOrder} disabled={loading} sx={{ py: 1.5 }}>
                {loading ? <CircularProgress size={24} /> : `Place Order - $${total.toFixed(2)}`}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
