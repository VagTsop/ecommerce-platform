import { useEffect, useState } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, Select, MenuItem, Box,
} from '@mui/material';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

export default function AdminUsers() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => { api.getUsers().then(setUsers); }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    await api.updateUserRole(userId, role);
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
  };

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Users ({users.length})</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: u.role === 'admin' ? 'secondary.main' : 'primary.main' }}>
                      {u.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip label={u.role} size="small" color={u.role === 'admin' ? 'secondary' : 'default'} sx={{ textTransform: 'capitalize' }} />
                </TableCell>
                <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {u.id === currentUser?.id ? (
                    <Typography variant="caption" color="text.secondary">Current user</Typography>
                  ) : (
                    <Select size="small" value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} sx={{ minWidth: 120 }}>
                      <MenuItem value="customer">Customer</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
