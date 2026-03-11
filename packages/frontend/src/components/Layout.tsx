import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Badge, Box, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Divider, Avatar, Menu, MenuItem, Container, InputBase, useTheme, alpha,
} from '@mui/material';
import {
  Menu as MenuIcon, ShoppingCart, FavoriteBorder, Search, DarkMode, LightMode,
  Home, Category, ShoppingBag, Person, Dashboard, Logout, Receipt,
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';

interface Props {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export default function Layout({ darkMode, onToggleTheme }: Props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navItems = [
    { label: 'Home', path: '/', icon: <Home /> },
    { label: 'Catalog', path: '/catalog', icon: <Category /> },
    ...(token ? [
      { label: 'Orders', path: '/orders', icon: <Receipt /> },
      { label: 'Wishlist', path: '/wishlist', icon: <FavoriteBorder /> },
    ] : []),
    ...(user?.role === 'admin' ? [
      { label: 'Admin', path: '/admin', icon: <Dashboard /> },
    ] : []),
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, cursor: 'pointer', color: 'primary.main', mr: 3 }} onClick={() => navigate('/')}>
            ShopHub
          </Typography>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
            {navItems.map(item => (
              <Box key={item.path} onClick={() => navigate(item.path)}
                sx={{ px: 1.5, py: 0.5, cursor: 'pointer', borderRadius: 1, fontWeight: 500, fontSize: '0.9rem',
                  color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}>
                {item.label}
              </Box>
            ))}
          </Box>

          {/* Search */}
          <Box component="form" onSubmit={handleSearch}
            sx={{ flexGrow: 1, display: 'flex', maxWidth: 400, mx: 'auto',
              bgcolor: alpha(theme.palette.common.black, 0.05), borderRadius: 2, px: 2 }}>
            <Search sx={{ alignSelf: 'center', color: 'text.secondary', mr: 1 }} />
            <InputBase placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, py: 0.8 }} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton onClick={onToggleTheme} size="small">
              {darkMode ? <LightMode /> : <DarkMode />}
            </IconButton>

            {token ? (
              <>
                <IconButton onClick={() => navigate('/wishlist')} size="small">
                  <FavoriteBorder />
                </IconButton>
                <IconButton onClick={() => navigate('/cart')} size="small">
                  <Badge badgeContent={itemCount} color="secondary">
                    <ShoppingCart />
                  </Badge>
                </IconButton>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ ml: 0.5 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                  PaperProps={{ sx: { minWidth: 180 } }}>
                  <MenuItem disabled sx={{ opacity: '1 !important' }}>
                    <Typography variant="body2" fontWeight={600}>{user?.name}</Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                    <ListItemIcon><Person fontSize="small" /></ListItemIcon> Profile
                  </MenuItem>
                  <MenuItem onClick={() => { setAnchorEl(null); navigate('/orders'); }}>
                    <ListItemIcon><ShoppingBag fontSize="small" /></ListItemIcon> Orders
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => { setAnchorEl(null); logout(); navigate('/'); }}>
                    <ListItemIcon><Logout fontSize="small" /></ListItemIcon> Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box onClick={() => navigate('/login')}
                sx={{ px: 2, py: 0.8, bgcolor: 'primary.main', color: 'white', borderRadius: 2, cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.85rem', '&:hover': { bgcolor: 'primary.dark' } }}>
                Sign In
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }}>
          <Typography variant="h6" sx={{ px: 2, mb: 1, fontWeight: 700, color: 'primary.main' }}>ShopHub</Typography>
          <Divider />
          <List>
            {navItems.map(item => (
              <ListItemButton key={item.path} selected={location.pathname === item.path}
                onClick={() => { navigate(item.path); setDrawerOpen(false); }}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Content */}
      <Box sx={{ flex: 1 }}>
        <Outlet />
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', py: 3, mt: 'auto' }}>
        <Container>
          <Typography variant="body2" color="text.secondary" align="center">
            ShopHub &copy; {new Date().getFullYear()} &mdash; E-Commerce Platform Demo
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
