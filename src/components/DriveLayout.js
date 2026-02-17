'use client';
import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import DriveHeader from './DriveHeader';
import DriveSidebar from './DriveSidebar';
import DriveMain from './DriveMain';
import RightPanel from './RightPanel'; // New component
import CssBaseline from '@mui/material/CssBaseline';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useDropzone } from 'react-dropzone';

const drawerWidth = 256;
const rightPanelWidth = 56;

const UploadProgress = ({ uploads, onClose }) => {
    if (uploads.length === 0) return null;

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'fixed',
                bottom: 24,
                right: rightPanelWidth + 24, // Adjust for right panel
                width: 360,
                maxHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '8px 8px 0 0',
                overflow: 'hidden',
                zIndex: 1300
            }}
        >
            <Box sx={{
                backgroundColor: '#323232',
                color: 'white',
                p: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Typography variant="body2">{uploads.length} upload selesai</Typography>
                <IconButton size="small" sx={{ color: 'white' }} onClick={onClose}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
            <Box sx={{ p: 0, overflowY: 'auto', maxHeight: 300 }}>
                {uploads.map((upload, index) => (
                    <Box key={index} sx={{ p: 2, borderBottom: '1px solid #f1f3f4', display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 2 }}>
                            {upload.progress === 100 ? (
                                <CheckCircleIcon color="success" />
                            ) : (
                                <CloudUploadIcon color="action" />
                            )}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="body2" noWrap sx={{ flexGrow: 1, fontWeight: 500 }}>{upload.name}</Typography>
                            </Box>
                            {upload.progress < 100 ? (
                                <LinearProgress variant="determinate" value={upload.progress} sx={{ height: 4, borderRadius: 2 }} />
                            ) : (
                                <Typography variant="caption" color="text.secondary">Upload selesai</Typography>
                            )}
                        </Box>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

export default function DriveLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [uploads, setUploads] = useState([]);

    const onDrop = useCallback(acceptedFiles => {
        const newUploads = acceptedFiles.map(file => ({
            name: file.name,
            progress: 0,
            id: Math.random().toString(36).substr(2, 9)
        }));
        setUploads(prev => [...prev, ...newUploads]);

        // Simulate upload progress
        newUploads.forEach((file) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.floor(Math.random() * 20) + 5;
                if (progress > 100) progress = 100;

                setUploads(prev => prev.map(u =>
                    u.id === file.id ? { ...u, progress } : u
                ));

                if (progress >= 100) clearInterval(interval);
            }, 800);
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ onDrop, noClick: true, noKeyboard: true });

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F8FAFD' }} {...getRootProps()}>
            <input {...getInputProps()} />
            <CssBaseline />
            <DriveHeader handleDrawerToggle={handleDrawerToggle} />

            {/* Mobile Sidebar Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true,
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: '#F8FAFD', border: 'none' },
                }}
            >
                <DriveSidebar onNewClick={open} />
            </Drawer>

            {/* Desktop Sidebar */}
            <Box
                component="nav"
                sx={{
                    width: { md: drawerWidth },
                    flexShrink: { md: 0 },
                    display: { xs: 'none', md: 'block' },
                    zIndex: 1000,
                }}
            >
                <Box sx={{ height: 64 }} />
                <DriveSidebar onNewClick={open} />
            </Box>

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    width: { md: `calc(100% - ${drawerWidth}px - ${rightPanelWidth}px)` },
                    height: '100%',
                    pt: '64px', // Match header height
                    pr: 0, // No padding right yet, container will have margin
                    position: 'relative'
                }}
            >
                {/* White container with rounded corners */}
                <Box sx={{
                    flexGrow: 1,
                    mt: 2,
                    mr: 2,
                    mb: 2,
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: 'none', // Flat look often better for internal containers
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}>
                    <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
                        <DriveMain />
                    </Box>

                    {isDragActive && (
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed #1a73e8',
                            borderRadius: '16px',
                            pointerEvents: 'none'
                        }}>
                            <CloudUploadIcon sx={{ fontSize: 64, color: '#1a73e8', mb: 2 }} />
                            <Typography variant="h5" color="primary" sx={{ fontWeight: 500 }}>
                                Lepaskan file untuk mengupload ke Drive Saya
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Right Side Panel */}
            <Box sx={{ width: { md: rightPanelWidth }, display: { xs: 'none', md: 'block' }, pt: '64px' }}>
                <RightPanel />
            </Box>

            <UploadProgress uploads={uploads} onClose={() => setUploads([])} />

        </Box>
    );
}
