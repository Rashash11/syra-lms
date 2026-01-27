'use client';

import React from 'react';
import { Box, Typography, Paper, Button, Card, CardContent, Chip, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useThemeMode } from '@shared/theme/ThemeContext';
import Grid from '@mui/material/GridLegacy';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const sessions = [
    { id: '1', title: 'JavaScript Workshop', course: 'Advanced JavaScript', date: 'Dec 20, 2024', time: '10:00 AM', attendees: 15, maxAttendees: 25, status: 'upcoming' },
    { id: '2', title: 'React Q&A Session', course: 'React Fundamentals', date: 'Dec 22, 2024', time: '2:00 PM', attendees: 28, maxAttendees: 30, status: 'upcoming' },
    { id: '3', title: 'Node.js Live Coding', course: 'Node.js Backend', date: 'Dec 10, 2024', time: '11:00 AM', attendees: 18, maxAttendees: 20, status: 'completed' },
];

export default function InstructorILTPage() {
    const { mode } = useThemeMode();

    const TEXT_COLOR = mode === 'liquid-glass' ? '#FFFFFF' : 'text.primary';
    const SECONDARY_TEXT = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.12)' : 'divider';

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" color={TEXT_COLOR}>ILT Sessions</Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    sx={{
                        bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'success.main',
                        color: '#FFFFFF',
                        '&:hover': {
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.3)' : 'success.dark',
                        },
                        ...(mode === 'liquid-glass' ? {
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                        } : {})
                    }}
                >
                    Create Session
                </Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Upcoming', value: sessions.filter(s => s.status === 'upcoming').length, icon: <EventIcon />, color: 'primary' },
                    { label: 'Total Attendees', value: sessions.reduce((s, sess) => s + sess.attendees, 0), icon: <PeopleIcon />, color: 'success' },
                    { label: 'Completed', value: sessions.filter(s => s.status === 'completed').length, icon: <CheckCircleIcon />, color: 'info' },
                ].map((stat) => (
                    <Grid item xs={4} key={stat.label}>
                        <Paper 
                            sx={{ 
                                p: 2, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 2,
                                ...(mode === 'liquid-glass' ? glassStyle : {})
                            }}
                        >
                            <Box 
                                sx={{ 
                                    p: 1, 
                                    borderRadius: 1, 
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : `${stat.color}.lighter`, 
                                    color: mode === 'liquid-glass' ? '#FFFFFF' : `${stat.color}.main` 
                                }}
                            >
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700} color={TEXT_COLOR}>{stat.value}</Typography>
                                <Typography variant="caption" color={SECONDARY_TEXT}>{stat.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <TableContainer 
                component={Paper}
                sx={{
                    ...(mode === 'liquid-glass' ? glassStyle : {})
                }}
            >
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}`, fontWeight: 600 }}>Session</TableCell>
                            <TableCell sx={{ color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}`, fontWeight: 600 }}>Course</TableCell>
                            <TableCell sx={{ color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}`, fontWeight: 600 }}>Date & Time</TableCell>
                            <TableCell align="center" sx={{ color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}`, fontWeight: 600 }}>Attendees</TableCell>
                            <TableCell sx={{ color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}`, fontWeight: 600 }}>Status</TableCell>
                            <TableCell align="right" sx={{ color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}`, fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sessions.map((session) => (
                            <TableRow 
                                key={session.id}
                                sx={{
                                    '& .MuiTableCell-root': { borderBottom: `1px solid ${DIVIDER}` }
                                }}
                            >
                                <TableCell><Typography fontWeight={500} color={TEXT_COLOR}>{session.title}</Typography></TableCell>
                                <TableCell sx={{ color: SECONDARY_TEXT }}>{session.course}</TableCell>
                                <TableCell sx={{ color: SECONDARY_TEXT }}>{session.date} at {session.time}</TableCell>
                                <TableCell align="center" sx={{ color: TEXT_COLOR }}>{session.attendees}/{session.maxAttendees}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={session.status} 
                                        size="small" 
                                        sx={{
                                            bgcolor: session.status === 'upcoming' 
                                                ? (mode === 'liquid-glass' ? 'rgba(25, 118, 210, 0.2)' : 'primary.main')
                                                : (mode === 'liquid-glass' ? 'rgba(46, 125, 50, 0.2)' : 'success.main'),
                                            color: mode === 'liquid-glass' ? '#FFFFFF' : 'white',
                                            ...(mode === 'liquid-glass' ? {
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                backdropFilter: 'blur(4px)'
                                            } : {})
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    {session.status === 'upcoming' ? (
                                        <Button 
                                            size="small" 
                                            startIcon={<EditIcon />}
                                            sx={{ color: TEXT_COLOR }}
                                        >
                                            Manage
                                        </Button>
                                    ) : (
                                        <Button 
                                            size="small"
                                            sx={{ color: TEXT_COLOR }}
                                        >
                                            Attendance
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
