import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, Card, CardMedia, CardContent, Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ArrowForward, LocalShipping, Security, Support, Replay } from '@mui/icons-material';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getProducts({ featured: '1', limit: '8' }),
      api.getCategories(),
    ]).then(([prodRes, cats]) => {
      setFeatured(prodRes.products);
      setCategories(cats);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      {/* Hero */}
      <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)', color: 'white', py: { xs: 6, md: 10 }, mb: 4 }}>
        <Container>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h3" fontWeight={800} sx={{ mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}>
                Discover Amazing Products
              </Typography>
              <Typography variant="h6" sx={{ mb: 3, opacity: 0.9, fontWeight: 400 }}>
                Shop the latest trends with free shipping on orders over $100. Quality products, unbeatable prices.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" size="large" color="secondary" endIcon={<ArrowForward />}
                  onClick={() => navigate('/catalog')} sx={{ px: 4 }}>
                  Shop Now
                </Button>
                <Button variant="outlined" size="large" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                  onClick={() => navigate('/catalog?featured=1')}>
                  Featured Items
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container>
        {/* Features */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {[
            { icon: <LocalShipping />, title: 'Free Shipping', desc: 'On orders over $100' },
            { icon: <Security />, title: 'Secure Payment', desc: 'SSL encrypted checkout' },
            { icon: <Support />, title: '24/7 Support', desc: 'Dedicated customer service' },
            { icon: <Replay />, title: 'Easy Returns', desc: '30-day return policy' },
          ].map(f => (
            <Grid size={{ xs: 6, md: 3 }} key={f.title}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ color: 'primary.main', mb: 1 }}>{f.icon}</Box>
                <Typography variant="subtitle2" fontWeight={600}>{f.title}</Typography>
                <Typography variant="caption" color="text.secondary">{f.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Categories */}
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Shop by Category</Typography>
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {loading ? Array(6).fill(0).map((_, i) => (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={i}><Skeleton variant="rounded" height={140} /></Grid>
          )) : categories.map(cat => (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={cat.id}>
              <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 }, transition: 'all 0.2s' }}
                onClick={() => navigate(`/catalog/${cat.slug}`)}>
                <CardMedia component="img" height="100" image={cat.image} alt={cat.name} sx={{ objectFit: 'cover' }} />
                <CardContent sx={{ py: 1.5, px: 1.5, textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight={600}>{cat.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{cat.product_count} products</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Featured Products */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Featured Products</Typography>
          <Button endIcon={<ArrowForward />} onClick={() => navigate('/catalog?featured=1')}>View All</Button>
        </Box>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {loading ? Array(4).fill(0).map((_, i) => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={i}><Skeleton variant="rounded" height={340} /></Grid>
          )) : featured.map(p => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={p.id}>
              <ProductCard product={p} />
            </Grid>
          ))}
        </Grid>

        {/* CTA Banner */}
        <Box sx={{ background: 'linear-gradient(135deg, #f50057 0%, #ff4081 100%)', borderRadius: 3, p: { xs: 3, md: 5 }, mb: 6, color: 'white', textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Join ShopHub Today!</Typography>
          <Typography sx={{ mb: 2, opacity: 0.9 }}>Get 10% off your first order with code WELCOME10</Typography>
          <Button variant="contained" sx={{ bgcolor: 'white', color: '#f50057', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
            onClick={() => navigate('/register')}>
            Create Account
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
