import { useState, useEffect } from 'react';
import { Container, Typography, Paper, TextField, Button, Alert, Box, Avatar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Person } from '@mui/icons-material';
import { api } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.getMe().then(setProfile).catch(() => {}); }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      const updated = await api.updateProfile({
        name: profile.name, phone: profile.phone, address_line1: profile.address_line1,
        address_line2: profile.address_line2, city: profile.city, state: profile.state,
        zip: profile.zip, country: profile.country,
      });
      setProfile(updated);
      updateUser({ ...user, name: updated.name });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <Container sx={{ py: 3, maxWidth: 'md' }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>My Profile</Typography>

      <Paper sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
          {profile.name?.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={600}>{profile.name}</Typography>
          <Typography color="text.secondary">{profile.email}</Typography>
          <Typography variant="caption" color="text.secondary">Member since {new Date(profile.created_at).toLocaleDateString()}</Typography>
        </Box>
      </Paper>

      {success && <Alert severity="success" sx={{ mb: 2 }}>Profile updated successfully!</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Personal Information</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Name" value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Phone" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </Grid>
          <Grid size={12}><Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1 }}>Shipping Address</Typography></Grid>
          <Grid size={12}>
            <TextField fullWidth label="Address Line 1" value={profile.address_line1 || ''} onChange={(e) => setProfile({ ...profile, address_line1: e.target.value })} />
          </Grid>
          <Grid size={12}>
            <TextField fullWidth label="Address Line 2" value={profile.address_line2 || ''} onChange={(e) => setProfile({ ...profile, address_line2: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="City" value={profile.city || ''} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="State" value={profile.state || ''} onChange={(e) => setProfile({ ...profile, state: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="ZIP Code" value={profile.zip || ''} onChange={(e) => setProfile({ ...profile, zip: e.target.value })} />
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </Box>
      </Paper>
    </Container>
  );
}
