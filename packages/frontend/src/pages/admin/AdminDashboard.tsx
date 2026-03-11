import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Chip, Skeleton, List, ListItemButton, ListItemText,
  ListItemAvatar, Avatar,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Inventory, ShoppingCart, People, AttachMoney, TrendingUp, Warning,
  ManageAccounts, LocalShipping, ListAlt,
} from '@mui/icons-material';
import { api } from '../../api/client';

const statusColors: Record<string, string> = {
  pending: '#ff9800', processing: '#2196f3', shipped: '#00bcd4', delivered: '#4caf50', cancelled: '#f44336',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getDashboard().then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <Container sx={{ py: 4 }}><Grid container spacing={3}>{Array(4).fill(0).map((_, i) =>
    <Grid size={{ xs: 6, md: 3 }} key={i}><Skeleton variant="rounded" height={120} /></Grid>)}</Grid></Container>;

  const stats = [
    { label: 'Total Revenue', value: `$${data?.totalRevenue?.toFixed(2) || '0'}`, icon: <AttachMoney />, color: '#4caf50' },
    { label: 'Total Orders', value: data?.totalOrders || 0, icon: <ShoppingCart />, color: '#2196f3' },
    { label: 'Total Products', value: data?.totalProducts || 0, icon: <Inventory />, color: '#ff9800' },
    { label: 'Total Customers', value: data?.totalUsers || 0, icon: <People />, color: '#9c27b0' },
  ];

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Admin Dashboard</Typography>

      {/* Quick Nav */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Products', path: '/admin/products', icon: <Inventory /> },
          { label: 'Orders', path: '/admin/orders', icon: <LocalShipping /> },
          { label: 'Users', path: '/admin/users', icon: <ManageAccounts /> },
        ].map(item => (
          <Chip key={item.path} icon={item.icon} label={item.label} onClick={() => navigate(item.path)}
            variant="outlined" sx={{ px: 1 }} />
        ))}
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map(stat => (
          <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${stat.color}15`, color: stat.color }}>{stat.icon}</Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, px: 1 }}>Recent Orders</Typography>
            <List disablePadding>
              {data?.recentOrders?.map((order: any) => (
                <ListItemButton key={order.id} onClick={() => navigate('/admin/orders')}>
                  <ListItemText
                    primary={`#${order.id.slice(0, 8)} - ${order.customer_name || 'Customer'}`}
                    secondary={new Date(order.created_at).toLocaleDateString()}
                  />
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={600}>${order.total.toFixed(2)}</Typography>
                    <Chip label={order.status} size="small"
                      sx={{ bgcolor: statusColors[order.status] || '#999', color: 'white', textTransform: 'capitalize', height: 22 }} />
                  </Box>
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Order Status + Low Stock */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, px: 1 }}>Orders by Status</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', px: 1 }}>
              {data?.ordersByStatus?.map((s: any) => (
                <Chip key={s.status} label={`${s.status}: ${s.count}`}
                  sx={{ bgcolor: statusColors[s.status] || '#999', color: 'white', textTransform: 'capitalize', fontWeight: 600 }} />
              ))}
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 1 }}>
              <Warning color="warning" />
              <Typography variant="h6" fontWeight={600}>Low Stock Alert</Typography>
            </Box>
            <List disablePadding>
              {data?.lowStock?.map((p: any) => {
                const images = JSON.parse(p.images || '[]');
                return (
                  <ListItemButton key={p.id} onClick={() => navigate('/admin/products')}>
                    <ListItemAvatar>
                      <Avatar src={images[0]} variant="rounded">{p.name.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={p.name} />
                    <Chip label={`${p.stock} left`} size="small" color={p.stock <= 5 ? 'error' : 'warning'} />
                  </ListItemButton>
                );
              })}
              {(!data?.lowStock || data.lowStock.length === 0) && (
                <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>All products well stocked!</Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Top Products */}
        <Grid size={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 1 }}>
              <TrendingUp color="primary" />
              <Typography variant="h6" fontWeight={600}>Top Selling Products</Typography>
            </Box>
            <List disablePadding>
              {data?.topProducts?.map((p: any, i: number) => {
                const images = JSON.parse(p.images || '[]');
                return (
                  <ListItemButton key={i}>
                    <ListItemAvatar>
                      <Avatar src={images[0]} variant="rounded">{p.name.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={p.name} secondary={`${p.total_sold} sold`} />
                    <Typography variant="body2" fontWeight={600} color="primary.main">${p.total_revenue?.toFixed(2)}</Typography>
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
