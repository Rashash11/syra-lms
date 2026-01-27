import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Chip, Box } from '@mui/material';
import { useThemeMode } from '@/shared/theme/ThemeContext';

interface DomainsEditorProps {
    open: boolean;
    domains: string[];
    onSave: (domains: string[]) => void;
    onClose: () => void;
}

export default function DomainsEditor({ open, domains, onSave, onClose }: DomainsEditorProps) {
    const [inputValue, setInputValue] = useState('');
    const [currentDomains, setCurrentDomains] = useState<string[]>(domains);
    const { mode } = useThemeMode();

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const handleAddDomain = () => {
        const trimmed = inputValue.trim();
        if (trimmed && !currentDomains.includes(trimmed)) {
            setCurrentDomains([...currentDomains, trimmed]);
            setInputValue('');
        }
    };

    const handleRemoveDomain = (domain: string) => {
        setCurrentDomains(currentDomains.filter(d => d !== domain));
    };

    const handleSave = () => {
        onSave(currentDomains);
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
            <DialogTitle>Restrict registration to specific domains</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Domain (e.g., example.com)"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDomain();
                        }
                    }}
                    helperText="Press Enter to add"
                    sx={{ 
                        mt: 2, 
                        mb: 2,
                        ...(mode === 'liquid-glass' ? {
                            '& .MuiOutlinedInput-root': {
                                ...glassStyle,
                                borderRadius: '12px',
                                '& fieldset': { border: 'none' }
                            }
                        } : {})
                    }}
                />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {currentDomains.map((domain) => (
                        <Chip
                            key={domain}
                            label={domain}
                            onDelete={() => handleRemoveDomain(domain)}
                        />
                    ))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
}
