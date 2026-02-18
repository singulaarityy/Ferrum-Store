'use client';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';
import { styled } from '@mui/material/styles';

const GoogleButton = styled(Button)(({ theme }) => ({
    textTransform: 'none',
    fontWeight: 500,
    backgroundColor: '#1a73e8',
    color: '#fff',
    borderRadius: 4,
    padding: '8px 24px',
    '&:hover': {
        backgroundColor: '#1765cc',
        boxShadow: '0 1px 3px 1px rgba(66,64,67,0.15), 0 1px 2px 0 rgba(60,64,67,0.3)',
    },
}));

export default function LoginModal({ open, onClose }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(email, password);
        if (result.success) {
            onClose();
        } else {
            setError(result.message || 'Login gagal. Periksa kembali email dan password.');
        }
        setLoading(false);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
                <Typography variant="h6" component="div" sx={{ color: '#202124', fontWeight: 400 }}>
                    Masuk
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: '24px !important' }}>
                <Typography variant="body2" sx={{ mb: 3, color: '#5f6368' }}>
                    Masuk untuk mengakses file dan folder pribadi Anda.
                </Typography>
                <form onSubmit={handleSubmit} id="login-form">
                    <TextField
                        autoFocus
                        margin="dense"
                        id="email"
                        label="Email"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        id="password"
                        label="Password"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ mb: 1 }}
                    />
                    {error && (
                        <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                            {error}
                        </Typography>
                    )}
                </form>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px 24px' }}>
                <Button onClick={onClose} sx={{ color: '#1a73e8', mr: 1 }}>
                    Batal
                </Button>
                <GoogleButton type="submit" form="login-form" disabled={loading}>
                    {loading ? 'Memproses...' : 'Masuk'}
                </GoogleButton>
            </DialogActions>
        </Dialog>
    );
}
