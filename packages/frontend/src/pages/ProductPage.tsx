import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Rating, Chip, Divider, Breadcrumbs, Link,
  Tab, Tabs, TextField, Alert, Skeleton, Paper, Avatar,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ShoppingCart, FavoriteBorder, Favorite, Home, Add, Remove, VerifiedUser } from '@mui/icons-material';
import { api } from '../api/client';
import { useCartStore } from '../stores/cartStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useAuthStore } from '../stores/authStore';
import ProductCard from '../components/ProductCard';

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { addToCart } = useCartStore();
  const { isWishlisted, toggle } = useWishlistStore();
  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.getProduct(slug).then(p => {
      setProduct(p);
      setSelectedImage(0);
      setQuantity(1);
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <Container sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}><Skeleton variant="rounded" height={500} /></Grid>
        <Grid size={{ xs: 12, md: 6 }}><Skeleton height={40} /><Skeleton height={30} /><Skeleton height={60} /><Skeleton height={200} /></Grid>
      </Grid>
    </Container>
  );

  if (!product) return <Container sx={{ py: 8, textAlign: 'center' }}><Typography>Product not found</Typography></Container>;

  const images = JSON.parse(product.images || '[]');
  const tags = JSON.parse(product.tags || '[]');
  const wishlisted = isWishlisted(product.id);
  const discount = product.compare_price ? Math.round((1 - product.price / product.compare_price) * 100) : 0;

  const handleAddToCart = () => {
    if (!token) { navigate('/login'); return; }
    addToCart(product.id, quantity);
  };

  const handleSubmitReview = async () => {
    setReviewError('');
    try {
      const review = await api.createReview({ product_id: product.id, ...reviewForm });
      setProduct({ ...product, reviews: [review, ...product.reviews], rating_count: product.rating_count + 1 });
      setReviewForm({ rating: 5, title: '', comment: '' });
    } catch (err: any) {
      setReviewError(err.message);
    }
  };

  return (
    <Container sx={{ py: 3 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link underline="hover" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} color="inherit" onClick={() => navigate('/')}>
          <Home sx={{ mr: 0.5 }} fontSize="small" /> Home
        </Link>
        <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }} onClick={() => navigate('/catalog')}>Catalog</Link>
        {product.category_slug && (
          <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }} onClick={() => navigate(`/catalog/${product.category_slug}`)}>{product.category_name}</Link>
        )}
        <Typography color="text.primary" noWrap sx={{ maxWidth: 200 }}>{product.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Images */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 1 }}>
            <Box component="img" src={images[selectedImage] || 'https://picsum.photos/600/600'} alt={product.name}
              sx={{ width: '100%', height: { xs: 300, md: 450 }, objectFit: 'cover' }} />
          </Paper>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {images.map((img: string, i: number) => (
              <Box key={i} onClick={() => setSelectedImage(i)}
                sx={{ width: 72, height: 72, borderRadius: 1, overflow: 'hidden', cursor: 'pointer', border: 2,
                  borderColor: i === selectedImage ? 'primary.main' : 'transparent' }}>
                <Box component="img" src={img} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ))}
          </Box>
        </Grid>

        {/* Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          {product.category_name && <Chip label={product.category_name} size="small" sx={{ mb: 1 }} />}
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>{product.name}</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Rating value={product.rating_avg} precision={0.5} readOnly />
            <Typography variant="body2" color="text.secondary">({product.rating_count} reviews)</Typography>
            <Typography variant="body2" color="text.secondary">|</Typography>
            <Typography variant="body2" color={product.stock > 0 ? 'success.main' : 'error.main'} fontWeight={600}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 2 }}>
            <Typography variant="h4" fontWeight={700} color="primary.main">${product.price.toFixed(2)}</Typography>
            {product.compare_price && (
              <>
                <Typography variant="h6" color="text.secondary" sx={{ textDecoration: 'line-through' }}>${product.compare_price.toFixed(2)}</Typography>
                <Chip label={`Save ${discount}%`} color="secondary" size="small" />
              </>
            )}
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>{product.description}</Typography>

          {product.sku && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>SKU: {product.sku}</Typography>}

          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {tags.map((tag: string) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Button size="small" onClick={() => setQuantity(Math.max(1, quantity - 1))} sx={{ minWidth: 40 }}><Remove /></Button>
              <Typography sx={{ px: 2, fontWeight: 600 }}>{quantity}</Typography>
              <Button size="small" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} sx={{ minWidth: 40 }}><Add /></Button>
            </Box>
            <Button variant="contained" size="large" startIcon={<ShoppingCart />} onClick={handleAddToCart}
              disabled={product.stock === 0} sx={{ flex: 1, py: 1.5 }}>
              Add to Cart
            </Button>
            <Button variant="outlined" onClick={() => { if (!token) { navigate('/login'); return; } toggle(product.id); }}
              sx={{ minWidth: 50, py: 1.5 }}>
              {wishlisted ? <Favorite color="secondary" /> : <FavoriteBorder />}
            </Button>
          </Box>

          <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
            <Typography variant="body2"><strong>Free Shipping</strong> on orders over $100</Typography>
            <Typography variant="body2"><strong>30-Day Returns</strong> &mdash; No questions asked</Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Tabs: Reviews & Related */}
      <Box sx={{ mt: 5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label={`Reviews (${product.reviews?.length || 0})`} />
          <Tab label="Related Products" />
        </Tabs>

        {tab === 0 && (
          <Box>
            {/* Write review */}
            {token && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Write a Review</Typography>
                {reviewError && <Alert severity="error" sx={{ mb: 2 }}>{reviewError}</Alert>}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="body2">Rating:</Typography>
                  <Rating value={reviewForm.rating} onChange={(_, v) => setReviewForm({ ...reviewForm, rating: v || 5 })} />
                </Box>
                <TextField fullWidth size="small" label="Title" value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth size="small" label="Comment" multiline rows={3} value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} sx={{ mb: 2 }} />
                <Button variant="contained" onClick={handleSubmitReview}>Submit Review</Button>
              </Paper>
            )}

            {/* Reviews list */}
            {product.reviews?.map((r: any) => (
              <Paper key={r.id} sx={{ p: 2.5, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.85rem' }}>{r.user_name?.charAt(0)}</Avatar>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{r.user_name}</Typography>
                      {r.verified_purchase === 1 && (
                        <Chip icon={<VerifiedUser />} label="Verified" size="small" color="success" variant="outlined" sx={{ height: 22 }} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">{new Date(r.created_at).toLocaleDateString()}</Typography>
                  </Box>
                </Box>
                <Rating value={r.rating} size="small" readOnly sx={{ mb: 0.5 }} />
                {r.title && <Typography variant="subtitle2" fontWeight={600}>{r.title}</Typography>}
                <Typography variant="body2" color="text.secondary">{r.comment}</Typography>
              </Paper>
            ))}
            {(!product.reviews || product.reviews.length === 0) && (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No reviews yet. Be the first!</Typography>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Grid container spacing={3}>
            {product.relatedProducts?.map((p: any) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={p.id}>
                <ProductCard product={p} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}
