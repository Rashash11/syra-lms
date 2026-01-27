'use client';

import React from 'react';
import {
    Box, Typography, Paper, Button, Card, CardContent, Chip, Avatar, Grid
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { useThemeMode } from '@/shared/theme/ThemeContext';

const sessions = [
    { id: '1', title: 'JavaScript Workshop', course: 'Advanced JavaScript', date: 'Dec 20, 2024', time: '10:00 AM - 12:00 PM', instructor: 'Dr. Jane Smith', type: 'online', status: 'upcoming' },
    { id: '2', title: 'React Q&A Session', course: 'React Fundamentals', date: 'Dec 22, 2024', time: '2:00 PM - 3:30 PM', instructor: 'Prof. Bob Johnson', type: 'online', status: 'upcoming' },
    { id: '3', title: 'Node.js Live Coding', course: 'Node.js Backend', date: 'Dec 10, 2024', time: '11:00 AM - 1:00 PM', instructor: 'Dr. Jane Smith', type: 'online', status: 'completed' },
];

export default function LearnerILTPage() {
    const { mode } = useThemeMode();
    const upcoming = sessions.filter(s => s.status === 'upcoming');
    const past = sessions.filter(s => s.status === 'completed');

    const TEXT_COLOR = mode === 'liquid-glass' ? '#fff' : 'text.primary';
    const ICON_COLOR = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'divider';

    const glassStyle = {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
        borderRadius: '24px',
    };

    return (
        <Box sx={{ color: TEXT_COLOR }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>ILT Sessions</Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6 }}>
                    <Paper sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        ...(mode === 'liquid-glass' ? glassStyle : { borderRadius: '12px' })
                    }}>
                        <Box sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : 'primary.lighter',
                            color: mode === 'liquid-glass' ? '#fff' : 'primary.main',
                            border: mode === 'liquid-glass' ? '1px solid rgba(255,255,255,0.2)' : 'none'
                        }}>
                            <EventIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={700} sx={{ color: 'inherit' }}>{upcoming.length}</Typography>
                            <Typography variant="caption" sx={{ color: ICON_COLOR }}>Upcoming Sessions</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <Paper sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        ...(mode === 'liquid-glass' ? glassStyle : { borderRadius: '12px' })
                    }}>
                        <Box sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : 'success.lighter',
                            color: mode === 'liquid-glass' ? '#fff' : 'success.main',
                            border: mode === 'liquid-glass' ? '1px solid rgba(255,255,255,0.2)' : 'none'
                        }}>
                            <AccessTimeIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={700} sx={{ color: 'inherit' }}>{past.length}</Typography>
                            <Typography variant="caption" sx={{ color: ICON_COLOR }}>Attended</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {upcoming.length > 0 && (
                <>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Upcoming Sessions</Typography>
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        {upcoming.map((session) => (
                            <Grid size={{ xs: 12, md: 6 }} key={session.id}>
                                <Card sx={{
                                    ...(mode === 'liquid-glass' ? glassStyle : { borderRadius: '12px' })
                                }}>
                                    <CardContent sx={{ color: TEXT_COLOR }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="h6" sx={{ color: 'inherit' }}>{session.title}</Typography>
                                            <Chip
                                                label={session.type}
                                                size="small"
                                                color="info"
                                                sx={{
                                                    ...(mode === 'liquid-glass' && {
                                                        bgcolor: 'rgba(255,255,255,0.2)',
                                                        color: '#fff'
                                                    })
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="body2" sx={{ mb: 2, color: ICON_COLOR }} gutterBottom>{session.course}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <EventIcon fontSize="small" sx={{ color: ICON_COLOR }} />
                                            <Typography variant="body2">{session.date}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <AccessTimeIcon fontSize="small" sx={{ color: ICON_COLOR }} />
                                            <Typography variant="body2">{session.time}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <Avatar sx={{
                                                width: 24,
                                                height: 24,
                                                fontSize: 10,
                                                bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.2)' : undefined,
                                                color: mode === 'liquid-glass' ? '#fff' : undefined,
                                                border: mode === 'liquid-glass' ? '1px solid rgba(255,255,255,0.3)' : 'none'
                                            }}>
                                                {session.instructor.split(' ').map(n => n[0]).join('')}
                                            </Avatar>
                                            <Typography variant="body2">{session.instructor}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="contained"
                                                startIcon={<VideoCallIcon />}
                                                fullWidth
                                                sx={{
                                                    ...(mode === 'liquid-glass' && {
                                                        bgcolor: 'rgba(255,255,255,0.2)',
                                                        color: '#fff',
                                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                                    })
                                                }}
                                            >
                                                Join Session
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                sx={{
                                                    borderColor: DIVIDER,
                                                    color: TEXT_COLOR,
                                                    ...(mode === 'liquid-glass' && {
                                                        '&:hover': {
                                                            borderColor: TEXT_COLOR,
                                                            bgcolor: 'rgba(255,255,255,0.1)'
                                                        }
                                                    })
                                                }}
                                            >
                                                Add to Calendar
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}

            {past.length > 0 && (
                <>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Past Sessions</Typography>
                    {past.map((session) => (
                        <Paper
                            key={session.id}
                            sx={{
                                p: 2,
                                mb: 1,
                                ...(mode === 'liquid-glass' ? glassStyle : { bgcolor: 'grey.50', borderRadius: '8px' })
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography fontWeight={500} sx={{ color: 'inherit' }}>{session.title}</Typography>
                                    <Typography variant="caption" sx={{ color: ICON_COLOR }}>{session.date} • {session.course}</Typography>
                                </Box>
                                <Chip
                                    label="Attended"
                                    size="small"
                                    color="success"
                                    sx={{
                                        ...(mode === 'liquid-glass' && {
                                            bgcolor: 'rgba(46, 125, 50, 0.3)',
                                            color: '#fff'
                                        })
                                    }}
                                />
                            </Box>
                        </Paper>
                    ))}
                </>
            )}
        </Box>
    );
}
