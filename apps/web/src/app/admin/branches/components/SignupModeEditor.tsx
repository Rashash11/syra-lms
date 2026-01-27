import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useThemeMode } from '@/shared/theme/ThemeContext';

interface SignupModeEditorProps {
    open: boolean;
    value: string;
    onSave: (value: string) => void;
    onClose: () => void;
}

export default function SignupModeEditor({ open, value, onSave, onClose }: SignupModeEditorProps) {
    const [selected, setSelected] = useState(value);
    const { mode } = useThemeMode();

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const handleSave = () => {
        onSave(selected);
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
            <DialogTitle>Sign up</DialogTitle>
            <DialogContent>
                <RadioGroup value={selected} onChange={(e) => setSelected(e.target.value)}>
                    <FormControlLabel value="direct" control={<Radio />} label="Direct" />
                    <FormControlLabel value="invitation" control={<Radio />} label="Invitation only" />
                    <FormControlLabel value="approval" control={<Radio />} label="Approval required" />
                </RadioGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
}
