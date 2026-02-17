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
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, alignItems: 'center' }}>
                        <IconButton size="large" color="inherit">
                            <HelpOutlineIcon />
                        </IconButton>
                        <IconButton size="large" color="inherit">
                            <SettingsIcon />
                        </IconButton>
                        <IconButton size="large" color="inherit">
                            <AppsIcon />
                        </IconButton>
                        <IconButton size="small" edge="end" color="inherit" sx={{ ml: 1 }}>
                            <Avatar alt="User" src="/static/images/avatar/1.jpg" sx={{ width: 32, height: 32 }} />
                        </IconButton>
                    </Box>

                </Toolbar>
            </AppBar>
        </Box>
    );
}
