'use client';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
});

const theme = createTheme({
    typography: {
        fontFamily: roboto.style.fontFamily,
    },
    palette: {
        primary: {
            main: '#1a73e8', // Google Blue
        },
        secondary: {
            main: '#e37400', // Google Drive accent (sometimes orange/yellow for folder)
        },
        background: {
            default: '#f8f9fa',
            paper: '#ffffff',
        },
        text: {
            primary: '#202124',
            secondary: '#5f6368',
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 24, // Pill shape often used
                    fontWeight: 500,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
                    },
                },
                containedPrimary: {
                    // The "New" button style
                    backgroundColor: '#fff',
                    color: '#1f1f1f', // Dark grey text
                    boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
                    '&:hover': {
                        backgroundColor: '#f1f3f4',
                        boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
                    },
                }
            },
        },
        MuiPaper: {
            styleOverrides: {
                rounded: {
                    borderRadius: 16,
                },
                elevation1: {
                    boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#fff',
                    color: '#5f6368',
                    boxShadow: 'none', // Flat Google style
                    borderBottom: '1px solid #dadce0',
                    zIndex: 1201, // Above Drawer
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: 'none',
                    backgroundColor: 'transparent',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: '0 24px 24px 0', // Half-pill shape for sidebar items
                    marginRight: 16, // Space for the pill shape
                    '&.Mui-selected': {
                        backgroundColor: '#e8f0fe',
                        color: '#1967d2',
                        '&:hover': {
                            backgroundColor: '#e8f0fe',
                        },
                        '& .MuiListItemIcon-root': {
                            color: '#1967d2',
                        },
                    },
                },
            },
        },
    },
});

import { AuthProvider } from '../context/AuthContext';

export default function ClientProviders({ children }) {
    return (
        <AuthProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </AuthProvider>
    );
}
