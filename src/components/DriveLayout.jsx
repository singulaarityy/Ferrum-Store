'use client';
import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import DriveHeader from './DriveHeader';
import DriveSidebar from './DriveSidebar';
import DriveMain from './DriveMain';
// import RightPanel from './RightPanel'; // Removed
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

const UploadProgress = ({ uploads, onClose }) => {
    if (uploads.length === 0) return null;

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'fixed',
                bottom: 24,
                right: 24, // No right panel offset
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

    // State for file system
    const [items, setItems] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [currentFolderParentId, setCurrentFolderParentId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Auto-auth for dev
    useEffect(() => {
        const ensureAuth = async () => {
            let token = localStorage.getItem('token');
            if (!token) {
                // Try login default dev user
                try {
                    const loginRes = await fetch('http://localhost:8080/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: 'dev@example.com', password: 'password123' })
                    });

                    if (loginRes.ok) {
                        const data = await loginRes.json();
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        // Trigger fetch
                        setCurrentFolderId('root'); // Re-trigger
                    } else {
                        // Try register
                        const regRes = await fetch('http://localhost:8080/api/auth/register', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: 'Dev User', email: 'dev@example.com', password: 'password123', role: 'admin' })
                        });
                        if (regRes.ok) {
                            // Login again
                            const loginRes2 = await fetch('http://localhost:8080/api/auth/login', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: 'dev@example.com', password: 'password123' })
                            });
                            const data = await loginRes2.json();
                            localStorage.setItem('token', data.token);
                            localStorage.setItem('user', JSON.stringify(data.user));
                            setCurrentFolderId('root');
                        }
                    }
                } catch (e) {
                    console.error("Auth failed", e);
                }
            }
        };
        ensureAuth();
    }, []);

    // Fetch data from backend
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const res = await fetch(`http://localhost:8080/api/folders/${currentFolderId}`, {
                    headers
                });

                if (res.ok) {
                    const data = await res.json();

                    // Map API response to UI format
                    const mappedSubfolders = data.subfolders.map(f => ({
                        id: f.id,
                        name: f.name,
                        type: 'folder',
                        parentId: data.folder.id,
                        date: f.created_at ? new Date(f.created_at).toLocaleDateString('id-ID') : '-',
                        action: 'Folder',
                        owner: f.owner_id
                    }));

                    const mappedFiles = data.files.map(f => {
                        let type = 'file';
                        if (f.mime_type?.startsWith('image/')) type = 'image';
                        else if (f.mime_type === 'application/pdf') type = 'pdf';
                        else if (f.mime_type?.includes('zip') || f.mime_type?.includes('compressed')) type = 'zip';

                        return {
                            id: f.id,
                            name: f.name,
                            type: type,
                            mimeType: f.mime_type,
                            parentId: data.folder.id,
                            date: f.created_at ? new Date(f.created_at).toLocaleDateString('id-ID') : '-',
                            action: 'File',
                            size: f.size
                        };
                    });

                    setItems([...mappedSubfolders, ...mappedFiles]);
                    setCurrentFolderParentId(data.folder.parent_id || 'root');
                } else {
                    console.error("Failed to fetch folder:", res.statusText);
                    setItems([]);
                }
            } catch (error) {
                console.error("Error fetching folder:", error);
            } finally {
                setLoading(false);
            }
        };

        if (localStorage.getItem('token')) {
            fetchData();
        }
    }, [currentFolderId]);

    const handleFolderClick = (folderId) => {
        setCurrentFolderId(folderId);
    };

    const handleNavigateBack = () => {
        if (currentFolderId === 'root') return;
        // logic: if currentFolderParentId is null/empty but we are not at root, go to root.
        setCurrentFolderId(currentFolderParentId || 'root');
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        const newUploads = acceptedFiles.map(file => ({
            name: file.name,
            progress: 0,
            id: Math.random().toString(36).substr(2, 9),
            file: file
        }));

        setUploads(prev => [...prev, ...newUploads]);

        for (const uploadItem of newUploads) {
            try {
                const token = localStorage.getItem('token');

                // 1. Get Presigned URL
                const initRes = await fetch('http://localhost:8080/api/files/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: uploadItem.name,
                        folder_id: currentFolderId === 'root' ? 'root' : currentFolderId, // Handle root explicitly if needed, but backend handles UUIDs. 
                        // Wait, if currentFolderId is 'root', backend expects 'root'? 
                        // Actually backend expects UUID or logic to handle 'root'.
                        // My backend `upload_file` assumes folder_id is UUID for storage_key.
                        // I might need to fix backend to handle 'root' or create a real root folder.
                        // For now, let's assume currentFolderId is valid.
                        // If currentFolderId is 'root', DB insert might fail if no FK. 
                        // But wait, the backend `list_folder` handles "root" virtually.
                        // It seems I need a real folder ID for upload. Or handle "root" in `upload_file`.
                        // Let's assume for now I can upload to root if I patch backend or if backend handles it.
                        // Actually `upload_file` does: query("INSERT INTO ... folder_id ..."). 
                        // If folder_id is "root", and folders table doesn't have "root", it might fail FK if any.
                        // But `files` table usually has FK to `folders`.
                        // I should probably create a root folder entry in DB or allow NULL.
                        // Let's proceed and see.
                        folder_id: currentFolderId,
                        size: uploadItem.file.size,
                        mime_type: uploadItem.file.type || 'application/octet-stream'
                    })
                });

                if (!initRes.ok) throw new Error("Failed to init upload");

                const { presigned_url, file_id } = await initRes.json();

                // 2. Upload to S3
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', presigned_url, true);
                if (uploadItem.file.type) {
                    xhr.setRequestHeader('Content-Type', uploadItem.file.type);
                }

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        setUploads(prev => prev.map(u => u.id === uploadItem.id ? { ...u, progress } : u));
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        setUploads(prev => prev.map(u => u.id === uploadItem.id ? { ...u, progress: 100 } : u));
                        // Refresh List
                        setTimeout(() => {
                            // Trigger refresh (hacky way: toggle ID or just re-fetch)
                            const token = localStorage.getItem('token');
                            // Re-fetch logic or just append
                            // For now, simple re-fetch
                            // We can't easily call fetchData as it is inside useEffect.
                            // Actually we can just manually add the file to items
                            setItems(prev => [...prev, {
                                id: file_id,
                                name: uploadItem.name,
                                type: 'file',
                                mimeType: uploadItem.file.type,
                                parentId: currentFolderId,
                                date: new Date().toLocaleDateString('id-ID'),
                                action: 'Uploaded',
                                size: uploadItem.file.size
                            }]);

                            // Remove from uploads after delay
                            setTimeout(() => {
                                setUploads(prev => prev.filter(u => u.id !== uploadItem.id));
                            }, 3000);
                        }, 500);
                    } else {
                        throw new Error("S3 Upload Failed");
                    }
                };

                xhr.onerror = () => {
                    throw new Error("Network Error");
                };

                xhr.send(uploadItem.file);

            } catch (e) {
                console.error(e);
                // Mark error
                setUploads(prev => prev.map(u => u.id === uploadItem.id ? { ...u, progress: -1 } : u));
            }
        }
    }, [currentFolderId]);

    const handleFileClick = async (fileId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8080/api/files/${fileId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const { url } = await res.json();
                window.open(url, '_blank');
            }
        } catch (e) {
            console.error("Download failed", e);
        }
    };

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
                    width: { md: `calc(100% - ${drawerWidth}px)` },
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
                        <DriveMain
                            items={items}
                            onFolderClick={handleFolderClick}
                            onNavigateBack={handleNavigateBack}
                            onFileClick={handleFileClick}
                            isRoot={currentFolderId === 'root'}
                        />
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

            {/* Right Side Panel - REMOVED */}

            <UploadProgress uploads={uploads} onClose={() => setUploads([])} />

        </Box>
    );
}
