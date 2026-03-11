import { useEffect, useState } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Avatar, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Edit, Delete, Add } from '@mui/icons-material';
import { api } from '../../api/client';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', description: '', price: '', compare_price: '', stock: '', category_id: '', featured: false,
  });

  useEffect(() => {
    api.getProducts({ limit: '100' }).then(r => setProducts(r.products));
    api.getCategories().then(setCategories);
  }, []);

  const openDialog = (product?: any) => {
    if (product) {
      setEditProduct(product);
      setForm({
        name: product.name, description: product.description || '', price: String(product.price),
        compare_price: product.compare_price ? String(product.compare_price) : '', stock: String(product.stock),
        category_id: product.category_id || '', featured: !!product.featured,
      });
    } else {
      setEditProduct(null);
      setForm({ name: '', description: '', price: '', compare_price: '', stock: '', category_id: '', featured: false });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data = {
      name: form.name, description: form.description, price: Number(form.price),
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      stock: Number(form.stock), category_id: form.category_id || null, featured: form.featured,
    };
    if (editProduct) {
      const updated = await api.updateProduct(editProduct.id, data);
      setProducts(products.map(p => p.id === editProduct.id ? { ...p, ...updated } : p));
    } else {
      const created = await api.createProduct(data);
      setProducts([created, ...products]);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await api.deleteProduct(id);
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <Container sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Products ({products.length})</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => openDialog()}>Add Product</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map(p => {
              const images = JSON.parse(p.images || '[]');
              return (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={images[0]} variant="rounded" sx={{ width: 48, height: 48 }}>{p.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.sku}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{p.category_name || '-'}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>${p.price.toFixed(2)}</Typography>
                    {p.compare_price && <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>${p.compare_price.toFixed(2)}</Typography>}
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={p.stock} size="small" color={p.stock <= 5 ? 'error' : p.stock <= 20 ? 'warning' : 'success'} />
                  </TableCell>
                  <TableCell>
                    <Chip label={p.status} size="small" color={p.status === 'active' ? 'success' : 'default'} />
                    {p.featured ? <Chip label="Featured" size="small" color="primary" sx={{ ml: 0.5 }} /> : null}
                  </TableCell>
                  <TableCell>
                    {p.rating_count > 0 ? `${p.rating_avg.toFixed(1)} (${p.rating_count})` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openDialog(p)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Description" multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Compare Price" type="number" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={form.category_id} label="Category" onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <FormControlLabel control={<Switch checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />} label="Featured Product" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name || !form.price}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
