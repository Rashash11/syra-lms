import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControlLabel, Switch, TextField } from '@mui/material';
import { useThemeMode } from '@/shared/theme/ThemeContext';

interface AnnouncementEditorProps {
    open: boolean;
    title: string;
    enabled: boolean;
    message: string;
    onSave: (enabled: boolean, message: string) => void;
    onClose: () => void;
}

export default function AnnouncementEditor({
    open,
    title,
    enabled,
    message,
    onSave,
    onClose
}: AnnouncementEditorProps) {
    const [isEnabled, setIsEnabled] = useState(enabled);
    const [text, setText] = useState(message || '');
    const { mode } = useThemeMode();

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const handleSave = () => {
        onSave(isEnabled, text);
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
                <FormControlLabel
                    control={<Switch checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />}
                    label="Enable announcement"
                    sx={{ mb: 2, mt: 1 }}
                />
                <TextField
                    fullWidth
                    label="Message"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    multiline
                    rows={4}
                    disabled={!isEnabled}
                    sx={{
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
