import { useEffect, useState } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Box, Select, MenuItem, FormControl, InputLabel, Pagination, Avatar,
} from '@mui/material';
import { api } from '../../api/client';

const statusColors: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  pending: 'warning', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'error',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page) };
    if (statusFilter) params.status = statusFilter;
    api.getAdminOrders(params).then(r => {
      setOrders(r.orders);
      setTotal(r.total);
      setPages(r.pages);
    }).finally(() => setLoading(false));
  };

  useEffect(fetchOrders, [page, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const updated = await api.updateOrderStatus(orderId, newStatus);
    setOrders(orders.map(o => o.id === orderId ? { ...o, ...updated } : o));
  };

  return (
    <Container sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700}>Orders ({total})</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter Status</InputLabel>
          <Select value={statusFilter} label="Filter Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">All</MenuItem>
            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Update</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map(order => (
              <TableRow key={order.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>#{order.id.slice(0, 8)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{order.customer_name}</Typography>
                  <Typography variant="caption" color="text.secondary">{order.customer_email}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {order.items?.slice(0, 3).map((item: any, i: number) => (
                      <Avatar key={i} src={item.product_image} variant="rounded" sx={{ width: 32, height: 32 }} />
                    ))}
                    {order.items?.length > 3 && (
                      <Avatar variant="rounded" sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'action.selected' }}>
                        +{order.items.length - 3}
                      </Avatar>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={600}>${order.total.toFixed(2)}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={order.status} size="small" color={statusColors[order.status] || 'default'} sx={{ textTransform: 'capitalize' }} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{new Date(order.created_at).toLocaleDateString()}</Typography>
                </TableCell>
                <TableCell>
                  <Select size="small" value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    sx={{ minWidth: 120, textTransform: 'capitalize' }}>
                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                      <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={pages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}
    </Container>
  );
}
