'use client';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
// Using some generic icons to represent Calendar, Keep, Tasks, Contacts
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'; // Keep
import TaskAltIcon from '@mui/icons-material/TaskAlt'; // Tasks
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'; // Contacts


export default function RightPanel() {
    return (
        <Box sx={{
            width: 56,
            height: '100%',
            borderLeft: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: 2,
            backgroundColor: '#F8FAFD'
        }}>
            <IconButton size="medium" sx={{ mb: 2 }}>
                <CalendarTodayIcon color="primary" sx={{ color: '#1a73e8' }} />
            </IconButton>
            <IconButton size="medium" sx={{ mb: 2 }}>
                <LightbulbOutlinedIcon sx={{ color: '#fbbc04' }} />
            </IconButton>
            <IconButton size="medium" sx={{ mb: 2 }}>
                <TaskAltIcon sx={{ color: '#1a73e8' }} />
            </IconButton>
            <IconButton size="medium" sx={{ mb: 2 }}>
                <PersonOutlineIcon sx={{ color: '#1a73e8' }} />
            </IconButton>

            <Divider sx={{ width: 24, my: 2 }} />

            <IconButton size="medium">
                <AddIcon />
            </IconButton>
        </Box>
    );
}
