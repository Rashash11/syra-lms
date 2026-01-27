import React from 'react';
import { Box, Typography, Select, MenuItem, FormControl } from '@mui/material';
import { useThemeMode } from '@/shared/theme/ThemeContext';

interface SelectRowProps {
    label: string;
    description?: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function SelectRow({
    label,
    description,
    value,
    options,
    onChange,
    disabled,
    placeholder
}: SelectRowProps) {
    const { mode } = useThemeMode();

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': {
                    borderBottom: 'none'
                }
            }}
        >
            <Box sx={{ flex: 1, pr: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {label}
                </Typography>
                {description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                        {description}
                    </Typography>
                )}
            </Box>
            <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    displayEmpty
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                ...glassStyle,
                                ...(mode === 'liquid-glass' ? {
                                    borderRadius: '12px',
                                    marginTop: '8px',
                                    '& .MuiMenuItem-root': {
                                        padding: '10px 16px',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '&.Mui-selected': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                            },
                                        },
                                    },
                                } : {
                                    bgcolor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '12px',
                                    marginTop: '8px',
                                }),
                            }
                        }
                    }}
                >
                    {placeholder && (
                        <MenuItem value="" disabled>
                            {placeholder}
                        </MenuItem>
                    )}
                    {options.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}
