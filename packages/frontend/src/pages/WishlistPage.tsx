import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Box, Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { FavoriteBorder } from '@mui/icons-material';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function WishlistPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getWishlist().then(setItems).finally(() => setLoading(false)); }, []);

  if (loading) return <Container sx={{ py: 4 }}><Grid container spacing={3}>{Array(4).fill(0).map((_, i) =>
    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={i}><Skeleton variant="rounded" height={340} /></Grid>)}</Grid></Container>;

  if (items.length === 0) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <FavoriteBorder sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>Your wishlist is empty</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Save items you love for later</Typography>
        <Button variant="contained" onClick={() => navigate('/catalog')}>Browse Products</Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>My Wishlist ({items.length})</Typography>
      <Grid container spacing={3}>
        {items.map(item => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.id}>
            <ProductCard product={{ ...item, id: item.product_id }} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
