'use client';

import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SummarizeIcon from '@mui/icons-material/Summarize';
import TranslateIcon from '@mui/icons-material/Translate';
import TextFormatIcon from '@mui/icons-material/TextFormat';

interface AIAssistPanelProps {
    onClose: () => void;
    onApplyAction: (action: string) => void;
}

export default function AIAssistPanel({ onClose, onApplyAction }: AIAssistPanelProps) {
    const actions = [
        { id: 'improve', label: 'Improve writing', icon: <AutoFixHighIcon sx={{ color: '#805ad5' }} /> },
        { id: 'summarize', label: 'Summarize', icon: <SummarizeIcon sx={{ color: '#3182ce' }} /> },
        { id: 'expand', label: 'Expand content', icon: <TextFormatIcon sx={{ color: '#38a169' }} /> },
        { id: 'fix', label: 'Fix grammar & spelling', icon: <TranslateIcon sx={{ color: '#e53e3e' }} /> },
    ];

    return (
        <Paper
            elevation={4}
            sx={{
                width: 320,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '1px solid rgba(141, 166, 166, 0.1)',
                bgcolor: 'background.paper',
            }}
        >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(141, 166, 166, 0.05)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoFixHighIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    AI ASSIST
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>
            <Divider />
            <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Select an action to apply to your current content or selection.
                </Typography>
                <List sx={{ p: 0 }}>
                    {actions.map((action) => (
                        <ListItem key={action.id} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => onApplyAction(action.id)}
                                sx={{
                                    borderRadius: '8px',
                                    border: '1px solid rgba(141, 166, 166, 0.1)',
                                    '&:hover': {
                                        bgcolor: 'rgba(141, 166, 166, 0.08)',
                                        borderColor: 'primary.main'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>{action.icon}</ListItemIcon>
                                <ListItemText primary={action.label} primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'text.primary' }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
            <Divider />
            <Box sx={{ p: 2, bgcolor: 'rgba(49, 130, 206, 0.08)' }}>
                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    Tip: Highlight text to apply AI actions to specific parts of your unit.
                </Typography>
            </Box>
        </Paper>
    );
}
