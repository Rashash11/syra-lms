'use client';

import React from 'react';
import {
    Box,
    Typography,
    Switch,
    Select,
    MenuItem,
    Button,
    IconButton,
    FormControl,
    Tooltip,
    TextField,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LinkIcon from '@mui/icons-material/Link';
import EditIcon from '@mui/icons-material/Edit';
import { MeetingBlockProps } from './types';

// Providers for integrated tool (only Zedny)
const INTEGRATED_PROVIDERS = [
    { value: 'zedny', label: 'Zedny Meet' },
];

// Providers for external tools (user provides their own link)
const EXTERNAL_PROVIDERS = [
    { value: 'zoom', label: 'Zoom' },
    { value: 'meet', label: 'Google Meet' },
    { value: 'custom', label: 'Other / Custom URL' },
];

export default function MeetingBlock({
    hasMeeting,
    meetingProvider,
    meetingUrl,
    isExternalTool = false,
    onToggleMeeting,
    onProviderChange,
    onUrlChange,
    onRemoveMeeting,
}: MeetingBlockProps) {
    const handleCopyLink = () => {
        if (meetingUrl) {
            navigator.clipboard.writeText(meetingUrl);
        }
    };

    // Use different provider lists based on session type
    const providers = isExternalTool ? EXTERNAL_PROVIDERS : INTEGRATED_PROVIDERS;

    // For external tools, always show editable URL field
    // For integrated tools (Zedny), URL is auto-generated
    const isUrlEditable = isExternalTool;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Toggle Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <VideocamIcon sx={{ color: hasMeeting ? 'primary.main' : 'text.secondary', fontSize: 20 }} />
                <Typography sx={{ flex: 1, color: 'text.primary', fontWeight: 500 }}>
                    {isExternalTool ? 'Add external meeting link' : 'Add Zedny Meet'}
                </Typography>
                <Switch
                    checked={hasMeeting}
                    onChange={(e) => onToggleMeeting(e.target.checked)}
                    color="primary"
                />
            </Box>

            {/* Expanded Meeting Details */}
            {hasMeeting && (
                <Box
                    sx={{
                        ml: 4,
                        p: 2,
                        borderRadius: '8px',
                        bgcolor: 'rgba(141, 166, 166, 0.05)',
                        border: '1px solid rgba(141, 166, 166, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                    }}
                >
                    {/* Provider Selector - only show for external tools with multiple options */}
                    {isExternalTool && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 80 }}>
                                Provider
                            </Typography>
                            <FormControl size="small" sx={{ flex: 1 }}>
                                <Select
                                    value={meetingProvider}
                                    onChange={(e) => onProviderChange(e.target.value)}
                                    sx={{
                                        bgcolor: 'background.paper',
                                        '& .MuiSelect-select': { py: 1 }
                                    }}
                                >
                                    {providers.map((p) => (
                                        <MenuItem key={p.value} value={p.value}>
                                            {p.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Meeting URL - Editable for external tools/custom */}
                    {isUrlEditable ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 80 }}>
                                Meeting URL
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Paste your meeting URL here..."
                                value={meetingUrl || ''}
                                onChange={(e) => onUrlChange(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'background.paper',
                                    }
                                }}
                                InputProps={{
                                    startAdornment: <LinkIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
                                    endAdornment: meetingUrl ? (
                                        <Tooltip title="Copy link">
                                            <IconButton size="small" onClick={handleCopyLink}>
                                                <ContentCopyIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                    ) : null
                                }}
                            />
                        </Box>
                    ) : (
                        /* Read-only URL display for integrated providers */
                        meetingUrl && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1.5,
                                    borderRadius: '6px',
                                    bgcolor: 'background.paper',
                                    border: '1px solid rgba(141, 166, 166, 0.1)',
                                }}
                            >
                                <LinkIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        flex: 1,
                                        color: 'primary.main',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {meetingUrl}
                                </Typography>
                                <Tooltip title="Copy link">
                                    <IconButton size="small" onClick={handleCopyLink}>
                                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )
                    )}

                    {/* Helper text for external tools */}
                    {isExternalTool && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>
                            Paste the meeting link from your external conferencing tool (Zoom, Teams, Webex, etc.)
                        </Typography>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={onRemoveMeeting}
                            sx={{ textTransform: 'none' }}
                        >
                            Remove meeting
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
