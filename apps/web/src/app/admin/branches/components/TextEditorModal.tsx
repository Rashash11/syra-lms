import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { useThemeMode } from '@/shared/theme/ThemeContext';

interface TextEditorModalProps {
    open: boolean;
    title: string;
    label: string;
    value: string;
    onSave: (value: string) => void;
    onClose: () => void;
    multiline?: boolean;
    maxLength?: number;
}

export default function TextEditorModal({
    open,
    title,
    label,
    value,
    onSave,
    onClose,
    multiline = false,
    maxLength
}: TextEditorModalProps) {
    const [text, setText] = useState(value || '');
    const { mode } = useThemeMode();

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const handleSave = () => {
        onSave(text);
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
                sx: {
                    ...glassStyle,
                    ...(mode === 'liquid-glass' ? {
                        borderRadius: '24px',
                    } : {
                        bgcolor: 'background.paper',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(141, 166, 166, 0.1)',
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }),
                    backgroundImage: 'none'
                }
            }}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label={label}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    multiline={multiline}
                    rows={multiline ? 4 : 1}
                    inputProps={{ maxLength }}
                    helperText={maxLength ? `${text.length}/${maxLength}` : ''}
                    sx={{ 
                        mt: 2,
                        ...(mode === 'liquid-glass' ? {
                            '& .MuiOutlinedInput-root': {
                                ...glassStyle,
                                borderRadius: '12px',
                                '& fieldset': { border: 'none' }
                            }
                        } : {})
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
}
