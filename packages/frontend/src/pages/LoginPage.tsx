import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Paper, Typography, TextField, Button, Alert, Box, Divider, Chip } from '@mui/material';
import { ShoppingBag } from '@mui/icons-material';
import { api } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login(email, password);
      setAuth(token, user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email: string) => {
    setLoading(true);
    setError('');
    try {
      const { token, user } = await api.login(email, 'password123');
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
            <Typography variant="h5" fontWeight={700}>Welcome to ShopHub</Typography>
            <Typography color="text.secondary">Sign in to your account</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleLogin}>
            <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required sx={{ mb: 2 }} />
            <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required sx={{ mb: 3 }} />
            <Button variant="contained" fullWidth size="large" type="submit" disabled={loading} sx={{ py: 1.3 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}><Chip label="Quick Demo Access" size="small" /></Divider>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" fullWidth onClick={() => quickLogin('admin@shophub.com')} disabled={loading} size="small">
              Admin
            </Button>
            <Button variant="outlined" fullWidth onClick={() => quickLogin('demo@shophub.com')} disabled={loading} size="small">
              Customer
            </Button>
          </Box>

          <Typography variant="body2" align="center" sx={{ mt: 3 }}>
            Don't have an account?{' '}
            <Box component={RouterLink} to="/register" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}>
              Sign Up
            </Box>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
