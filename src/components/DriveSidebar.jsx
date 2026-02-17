'use client';
import { useState } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import DevicesIcon from '@mui/icons-material/Devices';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningIcon from '@mui/icons-material/Warning'; // For alert
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred'; // Spam
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import FolderIcon from '@mui/icons-material/Folder'; // Using generic folder for now
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';

// Custom icons to match Google Drive perfectly would require SVGs, but we use closest MUI icons
// Home icon
import HomeFilledIcon from '@mui/icons-material/Home';

export default function DriveSidebar({ onNewClick }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [myDriveOpen, setMyDriveOpen] = useState(false);
    const [computersOpen, setComputersOpen] = useState(false);

    const handleListItemClick = (event, index) => {
        setSelectedIndex(index);
    };

    const navItems = [
        { text: 'Beranda', icon: <HomeFilledIcon />, index: 0, hasArrow: false },
    ];

    const secondaryItems = [
        { text: 'Dibagikan kepada saya', icon: <PeopleIcon />, index: 1 },
        { text: 'Terbaru', icon: <AccessTimeIcon />, index: 2 },
        { text: 'Berbintang', icon: <StarBorderIcon />, index: 3 },
    ];

    const tertiaryItems = [
        { text: 'Sampah', icon: <DeleteOutlineIcon />, index: 4 },
        { text: 'Penyimpanan (98% penuh)', icon: <CloudQueueIcon />, index: 5, alert: true },
    ];

    return (
        <Box sx={{ width: 256, pt: 1, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFD' }}>
            <Box sx={{ p: 2, pb: 2 }}>
                <Button
                    variant="contained"
                    onClick={onNewClick}
                    startIcon={<AddIcon fontSize="large" sx={{
                        color: '#ea4335', // Google Red for the plus
                        mr: 1
                    }} />}
                    sx={{
                        py: 1.5,
                        pl: 2,
                        pr: 3,
                        backgroundColor: 'white',
                        color: '#3c4043',
                        boxShadow: '0 1px 2px 0 rgba(60,64,67,0.30), 0 1px 3px 1px rgba(60,64,67,0.15)',
                        '&:hover': {
                            backgroundColor: '#f8f9fa', // Slight gray
                            boxShadow: '0 1px 3px 0 rgba(60,64,67,0.30), 0 4px 8px 3px rgba(60,64,67,0.15)',
                        },
                        borderRadius: '16px', // Slightly squared rounded corners as per screenshot
                        textTransform: 'none',
                        fontSize: '14px',
                        fontWeight: 500,
                        letterSpacing: '0.25px',
                        justifyContent: 'flex-start',
                        minWidth: 110,
                        height: 56
                    }}
                >
                    <Typography variant="button" sx={{ fontWeight: 500, fontSize: '14px', ml: 0.5 }}>Baru</Typography>
                </Button>
            </Box>

            <List component="nav" aria-label="main drive folders" sx={{ px: 2 }}>
                {navItems.map((item) => (
                    <ListItemButton
                        key={item.text}
                        selected={selectedIndex === item.index}
                        onClick={(event) => {
                            handleListItemClick(event, item.index);
                            if (item.toggle) item.toggle();
                        }}
                        sx={{
                            borderRadius: '24px', // Full pill shape
                            height: 32,
                            mb: 0.5,
                            pl: item.hasArrow ? 0.5 : 2, // Less padding if arrow exists
                            '&.Mui-selected': {
                                backgroundColor: '#C2E7FF', // Light blue selection from screenshot
                                color: '#001d35',
                                '&:hover': {
                                    backgroundColor: '#C2E7FF',
                                },
                                '& .MuiListItemIcon-root': {
                                    color: '#001d35',
                                }
                            }
                        }}
                    >
                        {item.hasArrow && (
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', color: '#444746', mr: 0.5 }}>
                                {item.isOpen ? <ArrowDropDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
                            </Box>
                        )}
                        <ListItemIcon sx={{ minWidth: 32, color: '#444746' }}>
                            {/* Clone the icon element to add color prop if selected */}
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                                fontSize: '14px',
                                fontWeight: selectedIndex === item.index ? 600 : 400,
                                variant: 'body2'
                            }}
                        />
                    </ListItemButton>
                ))}

                <Box sx={{ height: 8 }} />

                {secondaryItems.map((item) => (
                    <ListItemButton
                        key={item.text}
                        selected={selectedIndex === item.index}
                        onClick={(event) => handleListItemClick(event, item.index)}
                        sx={{
                            borderRadius: '24px',
                            height: 32,
                            mb: 0.5,
                            pl: 2,
                            '&.Mui-selected': {
                                backgroundColor: '#C2E7FF',
                                color: '#001d35',
                                '& .MuiListItemIcon-root': {
                                    color: '#001d35',
                                }
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 32, color: '#444746' }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '14px', fontWeight: 400 }} />
                    </ListItemButton>
                ))}

                <Box sx={{ height: 8 }} />

                {tertiaryItems.map((item) => (
                    <ListItemButton
                        key={item.text}
                        selected={selectedIndex === item.index}
                        onClick={(event) => handleListItemClick(event, item.index)}
                        sx={{
                            borderRadius: '24px',
                            height: 32,
                            mb: 0.5,
                            pl: 2,
                            '&.Mui-selected': {
                                backgroundColor: '#C2E7FF',
                                color: '#001d35',
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 32, color: '#444746' }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '14px', fontWeight: 400 }} />
                    </ListItemButton>
                ))}
            </List>

            <Box sx={{ px: 3, mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.85rem' }}>
                    14,82 GB dari 15 GB telah digunakan
                </Typography>
                <LinearProgress variant="determinate" value={98} sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                        backgroundColor: '#d93025' // Red warning color
                    }
                }} />

                <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                        mt: 2,
                        borderRadius: 5,
                        textTransform: 'none',
                        color: '#d93025',
                        borderColor: '#d93025', // Red border
                        '&:hover': {
                            backgroundColor: '#fce8e6',
                            borderColor: '#d93025'
                        }
                    }}>
                    Dapatkan penyimpanan ekstra
                </Button>
            </Box>
        </Box>
    );
}
