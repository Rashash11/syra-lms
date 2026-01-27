'use client';

import React from 'react';
import { Box, Button } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { SessionDrawerFooterProps } from './types';

export default function SessionDrawerFooter({
    onCancel,
    onDelete,
    isEditing,
}: SessionDrawerFooterProps) {
    return (
        <Box
            sx={{
                position: 'sticky',
                bottom: 0,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                p: 2,
                borderTop: '1px solid rgba(141, 166, 166, 0.1)',
                bgcolor: 'background.paper',
            }}
        >
            <Box>
                {isEditing && onDelete && (
                    <Button
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={onDelete}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                        }}
                    >
                        Delete session
                    </Button>
                )}
            </Box>

            <Button
                variant="outlined"
                onClick={onCancel}
                sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    borderColor: 'rgba(141, 166, 166, 0.2)',
                    color: 'text.primary',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(141, 166, 166, 0.05)'
                    }
                }}
            >
                Cancel
            </Button>
        </Box>
    );
}
