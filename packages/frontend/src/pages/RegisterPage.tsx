import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Paper, Typography, TextField, Button, Alert, Box } from '@mui/material';
import { ShoppingBag } from '@mui/icons-material';
import { api } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { token, user } = await api.register({ name: form.name, email: form.email, password: form.password });
      setAuth(token, user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <ShoppingBag sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>Create Account</Typography>
            <Typography color="text.secondary">Join ShopHub today</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleRegister}>
            <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              required sx={{ mb: 2 }} />
            <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              required sx={{ mb: 2 }} />
            <TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              required sx={{ mb: 2 }} />
            <TextField fullWidth label="Confirm Password" type="password" value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required sx={{ mb: 3 }} />
            <Button variant="contained" fullWidth size="large" type="submit" disabled={loading} sx={{ py: 1.3 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <Typography variant="body2" align="center" sx={{ mt: 3 }}>
            Already have an account?{' '}
            <Box component={RouterLink} to="/login" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}>
              Sign In
            </Box>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
