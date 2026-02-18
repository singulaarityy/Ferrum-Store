'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
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
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { useDropzone } from 'react-dropzone';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

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
    const { user, loading: authLoading, canEdit } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [uploads, setUploads] = useState([]);

    // State for file system
    const [items, setItems] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [currentFolderParentId, setCurrentFolderParentId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentFolderOwner, setCurrentFolderOwner] = useState(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null);

    // Create Folder Dialog State
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Refs for hidden inputs
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);

    // Fetch data from backend
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.listFolder(currentFolderId);

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
                    size: f.size,
                    owner: f.owner_id,
                    isPublic: f.is_public
                };
            });

            setItems([...mappedSubfolders, ...mappedFiles]);
            setCurrentFolderParentId(data.folder.parent_id || (data.folder.id === 'root' ? null : 'root'));
            setCurrentFolderOwner(data.folder.owner_id);
        } catch (error) {
            console.error("Error fetching folder:", error);
            // Handle 401/403 or other errors
            if (error.message.includes('401')) {
                // If 401 on root, it means we are not logged in.
                // But listFolder for 'root' should return 401 if not logged in.
                // We should handle this gracefully (e.g. show empty or redirect)
                setItems([]);
            }
        } finally {
            setLoading(false);
        }
    }, [currentFolderId]);

    useEffect(() => {
        if (!authLoading) {
            fetchData();
        }
    }, [currentFolderId, authLoading, fetchData]);

    const handleFolderClick = (folderId) => {
        setCurrentFolderId(folderId);
    };

    const handleNavigateBack = () => {
        if (currentFolderId === 'root') return;
        setCurrentFolderId(currentFolderParentId || 'root');
    };

    const handleContextMenu = (event) => {
        event.preventDefault();
        // Only allow context menu if user has edit permission for this folder
        if (!canEdit(currentFolderOwner) && currentFolderId !== 'root') {
            // Logic adjustment: Public users can't right click to upload?
            // Prompt: "tim media guru yang dapat membuat file... secara default file... private"
            // Assume restrictive.
            // If owner is different, check role.
            // For now, let's allow menu but fail action if forbidden? Or hide menu.
            // simpler: show menu, context sensitive.
        }

        setContextMenu(
            contextMenu === null
                ? {
                    mouseX: event.clientX + 2,
                    mouseY: event.clientY - 6,
                }
                : null,
        );
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleCreateFolderClick = () => {
        handleCloseContextMenu();
        setNewFolderName('');
        setCreateFolderOpen(true);
    };

    const confirmCreateFolder = async () => {
        try {
            await api.createFolder(newFolderName, currentFolderId);
            setCreateFolderOpen(false);
            fetchData();
        } catch (e) {
            console.error("Create folder failed", e);
            alert("Gagal membuat folder: " + e.message);
        }
    };

    const handleUploadFileClick = () => {
        handleCloseContextMenu();
        fileInputRef.current.click();
    };

    const handleUploadFolderClick = () => {
        handleCloseContextMenu();
        if (folderInputRef.current) {
            folderInputRef.current.setAttribute("webkitdirectory", "");
            folderInputRef.current.setAttribute("directory", "");
            folderInputRef.current.click();
        }
    };

    const handleUploadFiles = async (files) => {
        const newUploads = Array.from(files).map(file => ({
            name: file.name,
            progress: 0,
            id: Math.random().toString(36).substr(2, 9),
            file: file
        }));

        setUploads(prev => [...prev, ...newUploads]);

        for (const uploadItem of newUploads) {
            try {
                // 1. Init Upload
                const initRes = await api.uploadFileInit(
                    uploadItem.name,
                    currentFolderId,
                    uploadItem.file.size,
                    uploadItem.file.type || 'application/octet-stream'
                );

                const { presigned_url } = initRes;

                // 2. Upload to S3 (XHR for progress)
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
                        setTimeout(() => {
                            fetchData(); // Refresh list
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
                setUploads(prev => prev.map(u => u.id === uploadItem.id ? { ...u, progress: -1 } : u));
                alert(`Upload failed for ${uploadItem.name}: ${e.message}`);
            }
        }
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        handleUploadFiles(acceptedFiles);
    }, [currentFolderId]);

    const handleFileClick = async (fileId) => {
        try {
            const res = await api.getDownloadUrl(fileId);
            if (res && res.url) {
                window.open(res.url, '_blank');
            }
        } catch (e) {
            console.error("Download failed", e);
            alert("Gagal membuka file: " + e.message);
        }
    };

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ onDrop, noClick: true, noKeyboard: true });

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F8FAFD' }} {...getRootProps()}>
            <input {...getInputProps()} />
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleUploadFiles(e.target.files)}
                multiple
            />
            <input
                type="file"
                ref={folderInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleUploadFiles(e.target.files)}
                multiple
                webkitdirectory=""
                directory=""
            />

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
                <DriveSidebar onNewClick={handleContextMenu} />
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
                <DriveSidebar onNewClick={(e) => {
                    // Simulate context menu at button location or specific point
                    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY });
                }} />
            </Box>

            {/* Main Content Area */}
            <Box
                component="main"
                onContextMenu={handleContextMenu}
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    height: '100%',
                    pt: '64px',
                    pr: 0,
                    position: 'relative'
                }}
            >
                {/* White container */}
                <Box sx={{
                    flexGrow: 1,
                    mt: 2,
                    mr: 2,
                    mb: 2,
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: 'none',
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
                                Lepaskan file untuk mengupload
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            <UploadProgress uploads={uploads} onClose={() => setUploads([])} />

            {/* Context Menu */}
            <Menu
                open={contextMenu !== null}
                onClose={handleCloseContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                <MenuItem onClick={handleCreateFolderClick}>
                    <ListItemIcon>
                        <CreateNewFolderIcon fontSize="small" />
                    </ListItemIcon>
                    Folder baru
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleUploadFileClick}>
                    <ListItemIcon>
                        <UploadFileIcon fontSize="small" />
                    </ListItemIcon>
                    Upload file
                </MenuItem>
                <MenuItem onClick={handleUploadFolderClick}>
                    <ListItemIcon>
                        <DriveFolderUploadIcon fontSize="small" />
                    </ListItemIcon>
                    Upload folder
                </MenuItem>
            </Menu>

            {/* Create Folder Dialog */}
            <Dialog open={createFolderOpen} onClose={() => setCreateFolderOpen(false)}>
                <DialogTitle>Folder Baru</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Nama Folder"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateFolderOpen(false)}>Batal</Button>
                    <Button onClick={confirmCreateFolder}>Buat</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}
