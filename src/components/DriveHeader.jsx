'use client';
import { styled, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import AppsIcon from '@mui/icons-material/Apps';
import { useState } from 'react';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Logout from '@mui/icons-material/Logout';
import PersonAdd from '@mui/icons-material/PersonAdd';
import LoginModal from './LoginModal';
import { useAuth } from '../context/AuthContext';

import Avatar from '@mui/material/Avatar';
import MenuIcon from '@mui/icons-material/Menu';

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: 24, // Pill shape
    backgroundColor: '#E9EEF6', // Google's light blue-grey input background
    '&:hover': {
        backgroundColor: '#E2E7F0',
        boxShadow: '0 1px 1px 0 rgba(65,69,73,0.3), 0 1px 3px 1px rgba(65,69,73,0.15)',
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(3),
        width: 'auto',
        flexGrow: 1,
        maxWidth: 720,
    },
    transition: 'background-color 0.2s, box-shadow 0.2s',
    display: 'flex',
    alignItems: 'center',
    padding: '2px 8px',
    height: 48,
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 1),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#444746',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: '#1f1f1f',
    width: '100%',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        paddingLeft: `calc(1em + ${theme.spacing(0.5)})`, // Adjusted padding
        transition: theme.transitions.create('width'),
        width: '100%',
        fontSize: '16px',
    },
}));

export default function DriveHeader({ handleDrawerToggle }) {
    const { user, logout } = useAuth();
    const [loginOpen, setLoginOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    const handleLoginOpen = () => setLoginOpen(true);
    const handleLoginClose = () => setLoginOpen(false);

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleMenuClose();
        logout();
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#F8FAFD', color: '#444746', boxShadow: 'none' }}>
                <Toolbar sx={{ minHeight: '64px !important', paddingLeft: '12px !important', pr: '20px !important' }}>
                    {/* Logo Area */}
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="open drawer"
                        sx={{ mr: 1, display: { sm: 'block', md: 'none' } }}
                        onClick={handleDrawerToggle}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box sx={{ display: 'flex', alignItems: 'center', width: 230 }}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo_%282020%29.svg" alt="Drive" style={{ width: 40, height: 40, marginRight: 8 }} />
                        <Typography
                            variant="h6"
                            noWrap
                            component="div"
                            sx={{ display: { xs: 'none', sm: 'block' }, color: '#444746', fontWeight: 400, fontSize: '22px' }}
                        >
                            Drive
                        </Typography>
                    </Box>

                    {/* Search Bar */}
                    <Search>
                        <IconButton sx={{ p: '10px' }} aria-label="search">
                            <SearchIcon />
                        </IconButton>
                        <StyledInputBase
                            placeholder="Telusuri di Drive"
                            inputProps={{ 'aria-label': 'search' }}
                        />
                        <IconButton sx={{ p: '10px' }} aria-label="search options">
                            <TuneIcon />
                        </IconButton>
                    </Search>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Right Icons */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
                        <IconButton size="large" color="inherit">
                            <HelpOutlineIcon />
                        </IconButton>
                        <IconButton size="large" color="inherit">
                            <SettingsIcon />
                        </IconButton>
                        <IconButton size="large" color="inherit">
                            <AppsIcon />
                        </IconButton>

                        <IconButton
                            onClick={handleMenuClick}
                            size="small"
                            edge="end"
                            color="inherit"
                            sx={{ ml: 1 }}
                        >
                            <Avatar
                                alt={user ? user.name : "Publik"}
                                src={user ? "/static/images/avatar/1.jpg" : undefined}
                                sx={{ width: 32, height: 32, bgcolor: user ? undefined : '#bdbdbd' }}
                            />
                        </IconButton>

                        <Popover
                            open={openMenu}
                            anchorEl={anchorEl}
                            onClose={handleMenuClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            PaperProps={{
                                elevation: 0,
                                sx: {
                                    overflow: 'visible',
                                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                    mt: 1.5,
                                    width: 250,
                                    '&:before': {
                                        content: '""',
                                        display: 'block',
                                        position: 'absolute',
                                        top: 0,
                                        right: 14,
                                        width: 10,
                                        height: 10,
                                        bgcolor: 'background.paper',
                                        transform: 'translateY(-50%) rotate(45deg)',
                                        zIndex: 0,
                                    },
                                },
                            }}
                        >
                            <Box sx={{ p: 2, pb: 2, textAlign: 'center' }}>
                                {user ? (
                                    <>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{user.name}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{user.email}</Typography>
                                        <Button
                                            variant="outlined"
                                            onClick={handleLogout}
                                            startIcon={<Logout />}
                                            fullWidth
                                            sx={{ borderRadius: 24, textTransform: 'none' }}
                                        >
                                            Keluar
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>Pengguna Publik</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Login untuk mengakses file pribadi
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            onClick={() => {
                                                handleMenuClose();
                                                handleLoginOpen();
                                            }}
                                            fullWidth
                                            sx={{ borderRadius: 24, textTransform: 'none', bgcolor: '#1a73e8' }}
                                        >
                                            Masuk
                                        </Button>
                                    </>
                                )}
                            </Box>

                            {user && (
                                <>
                                    <Divider />
                                    <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
                                        <ListItemIcon>
                                            <PersonAdd fontSize="small" />
                                        </ListItemIcon>
                                        Tambah akun lain
                                    </MenuItem>
                                </>
                            )}
                        </Popover>
                    </Box>
                </Toolbar>
            </AppBar>
            <LoginModal open={loginOpen} onClose={handleLoginClose} />
        </Box>
    );
}
