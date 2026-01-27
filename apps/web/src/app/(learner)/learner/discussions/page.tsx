'use client';

import React from 'react';
import {
    Box, Typography, Paper, TextField, InputAdornment, Button,
    Card, CardContent, Avatar, Chip, Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ForumIcon from '@mui/icons-material/Forum';
import AddIcon from '@mui/icons-material/Add';
import { useThemeMode } from '@/shared/theme/ThemeContext';

const discussions = [
    { id: '1', title: 'Best practices for async/await', course: 'Advanced JavaScript', author: 'John Doe', replies: 12, lastActivity: '2 hours ago' },
    { id: '2', title: 'React hooks question', course: 'React Fundamentals', author: 'Jane Smith', replies: 8, lastActivity: '1 day ago' },
    { id: '3', title: 'Express middleware help', course: 'Node.js Backend', author: 'Bob Johnson', replies: 5, lastActivity: '3 days ago' },
];

export default function LearnerDiscussionsPage() {
    const { mode } = useThemeMode();

    const TEXT_COLOR = mode === 'liquid-glass' ? '#fff' : 'text.primary';
    const ICON_COLOR = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'divider';

    return (
        <Box sx={{ color: TEXT_COLOR }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Discussions</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                        ...(mode === 'liquid-glass' && {
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: '#fff',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                        })
                    }}
                >
                    New Thread
                </Button>
            </Box>

            <Paper sx={{
                p: 2,
                mb: 3,
                ...(mode === 'liquid-glass' ? {
                    backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
                    borderRadius: '16px',
                } : {
                    borderRadius: '12px',
                })
            }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search discussions..."
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: ICON_COLOR }} />
                            </InputAdornment>
                        )
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            color: TEXT_COLOR,
                            '& fieldset': { borderColor: DIVIDER },
                            '&:hover fieldset': { borderColor: TEXT_COLOR },
                            '&.Mui-focused fieldset': { borderColor: TEXT_COLOR },
                        }
                    }}
                />
            </Paper>

            <Grid container spacing={2}>
                {discussions.map((thread) => (
                    <Grid size={{ xs: 12 }} key={thread.id}>
                        <Card sx={{
                            cursor: 'pointer',
                            ...(mode === 'liquid-glass' ? {
                                backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
                                borderRadius: '16px',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    boxShadow: 'rgba(0, 0, 0, 0.3) 0px 8px 16px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
                                }
                            } : {
                                borderRadius: '12px',
                                '&:hover': { boxShadow: 4 }
                            })
                        }}>
                            <CardContent sx={{ color: TEXT_COLOR }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Avatar sx={{
                                        bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.2)' : 'primary.main',
                                        color: '#fff',
                                        border: mode === 'liquid-glass' ? '1px solid rgba(255,255,255,0.3)' : 'none'
                                    }}>
                                        {thread.author.split(' ').map(n => n[0]).join('')}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ color: 'inherit' }}>{thread.title}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                            <Chip
                                                label={thread.course}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    color: TEXT_COLOR,
                                                    borderColor: DIVIDER,
                                                    ...(mode === 'liquid-glass' && {
                                                        bgcolor: 'rgba(255,255,255,0.1)'
                                                    })
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ color: ICON_COLOR }}>by {thread.author}</Typography>
                                            <Typography variant="caption" sx={{ color: ICON_COLOR }}>•</Typography>
                                            <Typography variant="caption" sx={{ color: ICON_COLOR }}>{thread.replies} replies</Typography>
                                            <Typography variant="caption" sx={{ color: ICON_COLOR }}>•</Typography>
                                            <Typography variant="caption" sx={{ color: ICON_COLOR }}>{thread.lastActivity}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
