import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Container, Typography, Box, FormControl, InputLabel, Select, MenuItem, Pagination,
  Slider, Chip, Skeleton, Paper, Breadcrumbs, Link,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Home } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function CatalogPage() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';
  const featured = searchParams.get('featured') || '';
  const [priceRange, setPriceRange] = useState<number[]>([0, 1500]);

  useEffect(() => { api.getCategories().then(setCategories); }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), sort, limit: '12' };
    if (category) params.category = category;
    if (search) params.search = search;
    if (featured) params.featured = featured;
    if (priceRange[0] > 0) params.min_price = String(priceRange[0]);
    if (priceRange[1] < 1500) params.max_price = String(priceRange[1]);

    api.getProducts(params).then(res => {
      setProducts(res.products);
      setTotal(res.total);
      setPages(res.pages);
    }).finally(() => setLoading(false));
  }, [category, page, sort, search, featured, priceRange]);

  const updateParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const currentCategory = categories.find(c => c.slug === category);

  return (
    <Container sx={{ py: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link underline="hover" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} color="inherit" onClick={() => navigate('/')}>
          <Home sx={{ mr: 0.5 }} fontSize="small" /> Home
        </Link>
        <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }} onClick={() => navigate('/catalog')}>Catalog</Link>
        {currentCategory && <Typography color="text.primary">{currentCategory.name}</Typography>}
      </Breadcrumbs>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        {search ? `Search: "${search}"` : currentCategory?.name || 'All Products'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {total} product{total !== 1 ? 's' : ''} found
      </Typography>

      <Grid container spacing={3}>
        {/* Filters sidebar */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Categories</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              <Chip label="All" size="small" variant={!category ? 'filled' : 'outlined'} color={!category ? 'primary' : 'default'}
                onClick={() => navigate('/catalog')} />
              {categories.map(cat => (
                <Chip key={cat.id} label={`${cat.name} (${cat.product_count})`} size="small"
                  variant={category === cat.slug ? 'filled' : 'outlined'} color={category === cat.slug ? 'primary' : 'default'}
                  onClick={() => navigate(`/catalog/${cat.slug}`)} />
              ))}
            </Box>
          </Paper>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Price Range</Typography>
            <Slider value={priceRange} onChange={(_, v) => setPriceRange(v as number[])} onChangeCommitted={(_, v) => setPriceRange(v as number[])}
              min={0} max={1500} step={10} valueLabelDisplay="auto" valueLabelFormat={v => `$${v}`} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">${priceRange[0]}</Typography>
              <Typography variant="caption">${priceRange[1]}</Typography>
            </Box>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Sort By</Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Sort</InputLabel>
              <Select value={sort} label="Sort" onChange={(e) => updateParam('sort', e.target.value)}>
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="price">Price: Low to High</MenuItem>
                <MenuItem value="price_desc">Price: High to Low</MenuItem>
                <MenuItem value="name">Name A-Z</MenuItem>
                <MenuItem value="rating">Top Rated</MenuItem>
                <MenuItem value="popular">Most Reviewed</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Product grid */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Grid container spacing={2.5}>
            {loading ? Array(8).fill(0).map((_, i) => (
              <Grid size={{ xs: 6, sm: 4, lg: 3 }} key={i}><Skeleton variant="rounded" height={340} /></Grid>
            )) : products.length === 0 ? (
              <Grid size={12}>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary">No products found</Typography>
                </Box>
              </Grid>
            ) : products.map(p => (
              <Grid size={{ xs: 6, sm: 4, lg: 3 }} key={p.id}>
                <ProductCard product={p} />
              </Grid>
            ))}
          </Grid>
          {pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination count={pages} page={page} onChange={(_, p) => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(p));
                setSearchParams(params);
              }} color="primary" />
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
