'use client';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { suggestedFolders, suggestedFiles } from '../data/homeData'; // Import new data
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FilterListIcon from '@mui/icons-material/FilterList';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const FileIcon = ({ type, fontSize = 24 }) => {
    if (type === 'folder') return <FolderIcon sx={{ color: '#5f6368', fontSize }} />;
    if (type === 'image') return <ImageIcon sx={{ color: '#d93025', fontSize }} />;
    if (type === 'pdf') return <PictureAsPdfIcon sx={{ color: '#f40f02', fontSize }} />;
    if (type === 'zip') return <FolderZipIcon sx={{ color: '#5f6368', fontSize }} />;
    if (type === 'html') return <InsertDriveFileIcon sx={{ color: '#1a73e8', fontSize }} />;
    if (type === 'excel') return <InsertDriveFileIcon sx={{ color: '#188038', fontSize }} />;
    return <InsertDriveFileIcon sx={{ color: '#1a73e8', fontSize }} />;
};

const FolderCard = ({ folder }) => (
    <Card variant="outlined" sx={{
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        boxShadow: 'none',
        '&:hover': {
            backgroundColor: '#f8f9fa',
            cursor: 'pointer',
            boxShadow: '0 1px 2px 0 rgba(60,64,67,0.30), 0 1px 3px 1px rgba(60,64,67,0.15)',
        },
        minWidth: 200
    }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', p: '12px !important', pb: '12px !important' }}>
            <FolderIcon sx={{ color: '#5f6368', fontSize: 24, mr: 2 }} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 500, color: '#1f1f1f', fontSize: '14px' }}>
                    {folder.name}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#5f6368', display: 'block' }}>
                    {folder.location}
                </Typography>
            </Box>
            <IconButton size="small">
                <MoreVertIcon fontSize="small" />
            </IconButton>
        </CardContent>
    </Card>
);

const FilePreviewCard = ({ file }) => (
    <Card variant="outlined" sx={{
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
            boxShadow: '0 1px 2px 0 rgba(60,64,67,0.30), 0 1px 3px 1px rgba(60,64,67,0.15)',
            cursor: 'pointer'
        }
    }}>
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                <FileIcon type={file.type} fontSize={20} />
                <Typography variant="body2" noWrap sx={{ ml: 1, fontWeight: 500, color: '#1f1f1f', fontSize: '14px' }}>
                    {file.name}
                </Typography>
            </Box>
            <IconButton size="small">
                <MoreVertIcon fontSize="small" />
            </IconButton>
        </Box>

        {/* Preview Area */}
        <Box sx={{
            flexGrow: 1,
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 140,
            overflow: 'hidden'
        }}>
            {/* Visual representation of content */}
            {file.type === 'zip' ? (
                <Box sx={{ p: 2, backgroundColor: '#5f6368', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>ZIP</Typography>
                </Box>
            ) : (
                <FileIcon type={file.type} fontSize={64} />
            )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center' }}>
            <Avatar src="/static/images/avatar/1.jpg" sx={{ width: 24, height: 24, mr: 1 }} />
            <Typography variant="caption" color="text.secondary" noWrap>
                {file.action} • {file.date}
            </Typography>
        </Box>
    </Card>
);


export default function DriveMain({ items = [], onFolderClick, onNavigateBack, isRoot = true }) {
    const [view, setView] = useState('grid');

    const handleViewChange = (event, nextView) => {
        if (nextView !== null) {
            setView(nextView);
        }
    };

    const folders = items.filter(item => item.type === 'folder');
    const files = items.filter(item => item.type !== 'folder');

    return (
        <Box sx={{ flexGrow: 1, p: 3, pt: 2, overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {!isRoot && (
                    <IconButton onClick={onNavigateBack} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
                <Typography variant="h5" sx={{ color: '#1f1f1f', fontWeight: 400 }}>
                    {isRoot ? 'Selamat datang di Drive' : 'Folder'}
                </Typography>
            </Box>

            {/* Folders Section */}
            {folders.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: '#1f1f1f', fontWeight: 500 }}>
                        Folder
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2 }}>
                        {folders.map(folder => (
                            <Box key={folder.id} onClick={() => onFolderClick(folder.id)}>
                                <FolderCard folder={folder} />
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Files Section */}
            {files.length > 0 && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: '#1f1f1f', fontWeight: 500 }}>
                            File
                        </Typography>

                        <ToggleButtonGroup
                            value={view}
                            exclusive
                            onChange={handleViewChange}
                            aria-label="view mode"
                            size="small"
                            sx={{ height: 32 }}
                        >
                            <ToggleButton value="list" aria-label="list view" sx={{ borderRadius: '16px 0 0 16px', border: '1px solid #c7c7c7' }}>
                                <FilterListIcon fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value="grid" aria-label="grid view" sx={{ borderRadius: '0 16px 16px 0', border: '1px solid #c7c7c7' }}>
                                <ViewModuleIcon fontSize="small" />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
                        {files.map((file) => (
                            <FilePreviewCard key={file.id} file={file} />
                        ))}
                    </Box>
                </Box>
            )}

            {items.length === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 10 }}>
                    <Typography variant="body1" color="text.secondary">Folder ini kosong</Typography>
                </Box>
            )}
        </Box>
    );
}
