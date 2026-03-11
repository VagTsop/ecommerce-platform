import { Card, CardMedia, CardContent, Typography, Box, IconButton, Chip, Rating } from '@mui/material';
import { FavoriteBorder, Favorite, ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useAuthStore } from '../stores/authStore';

interface Props {
  product: any;
}

export default function ProductCard({ product }: Props) {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { addToCart } = useCartStore();
  const { isWishlisted, toggle } = useWishlistStore();
  const images = JSON.parse(product.images || '[]');
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) { navigate('/login'); return; }
    addToCart(product.id);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) { navigate('/login'); return; }
    toggle(product.id);
  };

  const discount = product.compare_price ? Math.round((1 - product.price / product.compare_price) * 100) : 0;

  return (
    <Card sx={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}
      onClick={() => navigate(`/product/${product.slug}`)}>
      {discount > 0 && (
        <Chip label={`-${discount}%`} color="secondary" size="small" sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1, fontWeight: 700 }} />
      )}
      <IconButton onClick={handleWishlist}
        sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }} size="small">
        {wishlisted ? <Favorite color="secondary" fontSize="small" /> : <FavoriteBorder fontSize="small" />}
      </IconButton>
      <CardMedia component="img" height="220" image={images[0] || 'https://picsum.photos/seed/placeholder/600/600'}
        alt={product.name} sx={{ objectFit: 'cover' }} />
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {product.category_name && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>{product.category_name}</Typography>
        )}
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5, lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {product.name}
        </Typography>
        {product.rating_count > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Rating value={product.rating_avg} precision={0.5} size="small" readOnly />
            <Typography variant="caption" color="text.secondary">({product.rating_count})</Typography>
          </Box>
        )}
        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ lineHeight: 1 }}>
              ${product.price.toFixed(2)}
            </Typography>
            {product.compare_price && (
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                ${product.compare_price.toFixed(2)}
              </Typography>
            )}
          </Box>
          <IconButton color="primary" onClick={handleAddToCart} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }} size="small">
            <ShoppingCart fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
