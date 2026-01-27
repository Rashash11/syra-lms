'use client';

import React from 'react';
import { Box, IconButton, TextField, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { SessionDrawerHeaderProps } from './types';

export default function SessionDrawerHeader({
    title,
    onTitleChange,
    onClose,
    onSave,
    isSaveDisabled
}: SessionDrawerHeaderProps) {
    return (
        <Box
            sx={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderBottom: '1px solid rgba(141, 166, 166, 0.1)',
                bgcolor: 'background.paper',
            }}
        >
            <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                <CloseIcon />
            </IconButton>

            <TextField
                fullWidth
                variant="standard"
                placeholder="Add title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                InputProps={{
                    disableUnderline: true,
                    sx: {
                        fontSize: '1.5rem',
                        fontWeight: 500,
                        color: 'text.primary',
                    }
                }}
                sx={{ flex: 1 }}
            />

            <Button
                variant="contained"
                onClick={onSave}
                disabled={isSaveDisabled}
                sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    borderRadius: '20px',
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&:disabled': {
                        bgcolor: 'rgba(141, 166, 166, 0.3)',
                        color: 'text.disabled'
                    }
                }}
            >
                Save
            </Button>
        </Box>
    );
}
