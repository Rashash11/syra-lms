'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress,
    Button, useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';
import { useThemeMode } from '@shared/theme/ThemeContext';

interface Assignment {
    id: string;
    title: string;
    description: string | null;
    courseId: string | null;
    dueAt: string | null;
    course?: {
        title: string;
        code: string;
    };
}

interface Submission {
    id: string;
    assignmentId: string;
    assignmentTitle?: string;
    status: string;
    score: number | null;
}

export default function LearnerAssignmentsPage() {
    const { mode } = useThemeMode();
    const theme = useTheme();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const TEXT_COLOR = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.9)' : 'inherit';
    const ICON_COLOR = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : 'primary.main';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'divider';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === '1') {
                console.log('[Learner Assignments] Fetching assignments...');
            }
            const [assignmentsRes, submissionsRes] = await Promise.all([
                fetch('/api/assignments'),
                fetch('/api/submissions') // Returns own submissions
            ]);

            if (assignmentsRes.ok) {
                const data = await assignmentsRes.json();
                if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === '1') {
                    console.log('[Learner Assignments] Assignments received:', data);
                }
                setAssignments(data.data || []);
            } else {
                console.error('[Learner Assignments] Failed to fetch assignments:', assignmentsRes.status);
            }

            if (submissionsRes.ok) {
                const data = await submissionsRes.json();
                if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === '1') {
                    console.log('[Learner Assignments] Submissions received:', data);
                }
                setSubmissions(data.data || []);
            }
        } catch (err) {
            console.error('[Learner Assignments] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSubmissionStatus = (assignmentId: string) => {
        // Match submissions by assignment ID
        const sub = submissions.find(s => s.assignmentId === assignmentId);
        if (sub) {
            return { status: sub.status, score: sub.score };
        }
        return null;
    };

    const filtered = assignments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.course?.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Box sx={{ p: 3, color: TEXT_COLOR }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AssignmentOutlinedIcon fontSize="large" sx={{ color: ICON_COLOR }} />
                    My Assignments
                </Typography>
            </Box>

            <Paper sx={{
                width: '100%',
                mb: 2,
                ...(mode === 'liquid-glass' ? {
                    backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
                    borderRadius: '24px',
                } : {
                    borderRadius: '12px',
                })
            }}>
                <Box sx={{ p: 2 }}>
                    <TextField
                        placeholder="Search assignments..."
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: TEXT_COLOR,
                                '& fieldset': { borderColor: DIVIDER },
                                '&:hover fieldset': { borderColor: ICON_COLOR },
                                '&.Mui-focused fieldset': { borderColor: ICON_COLOR },
                            },
                            '& .MuiInputAdornment-root': { color: ICON_COLOR }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { borderColor: DIVIDER, color: TEXT_COLOR, fontWeight: 700 } }}>
                                <TableCell>Assignment</TableCell>
                                <TableCell>Course</TableCell>
                                <TableCell>Due Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Score</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} align="center"><CircularProgress color={mode === 'liquid-glass' ? 'inherit' : 'primary'} /></TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ color: TEXT_COLOR }}>No assignments found</TableCell></TableRow>
                            ) : (
                                filtered.map((a) => {
                                    const subInfo = getSubmissionStatus(a.id);
                                    const status = subInfo ? subInfo.status : 'PENDING';
                                    const isLate = a.dueAt && new Date(a.dueAt) < new Date() && status === 'PENDING';

                                    return (
                                        <TableRow key={a.id} hover sx={{
                                            '& td': { borderColor: DIVIDER, color: TEXT_COLOR },
                                            '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }
                                        }}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500} color={TEXT_COLOR}>{a.title}</Typography>
                                                {a.description && (
                                                    <Typography variant="caption" color={mode === 'liquid-glass' ? 'rgba(255,255,255,0.6)' : "text.secondary"} noWrap sx={{ maxWidth: 300, display: 'block' }}>
                                                        {a.description}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {a.course ? (
                                                    <Chip
                                                        label={a.course.title}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ color: TEXT_COLOR, borderColor: DIVIDER }}
                                                    />
                                                ) : (
                                                    <Typography variant="caption" color={mode === 'liquid-glass' ? 'rgba(255,255,255,0.5)' : "text.secondary"}>N/A</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography color={isLate ? 'error' : 'inherit'}>
                                                    {a.dueAt ? new Date(a.dueAt).toLocaleDateString() : 'No limit'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {status === 'GRADED' && <Chip icon={<CheckCircleIcon />} label="Graded" color="success" size="small" />}
                                                {status === 'SUBMITTED' && <Chip icon={<CheckCircleIcon />} label="Submitted" color="primary" size="small" />}
                                                {status === 'PENDING' && isLate && <Chip icon={<WarningIcon />} label="Overdue" color="error" size="small" />}
                                                {status === 'PENDING' && !isLate && (
                                                    <Chip
                                                        icon={<PendingIcon />}
                                                        label="Pending"
                                                        size="small"
                                                        sx={{ color: TEXT_COLOR, '& .MuiChip-icon': { color: TEXT_COLOR } }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {subInfo?.score !== undefined && subInfo.score !== null ? (
                                                    <Typography fontWeight="bold" color={TEXT_COLOR}>{subInfo.score} / 100</Typography>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    size="small"
                                                    variant={status === 'PENDING' ? 'contained' : 'outlined'}
                                                    href={`/learner/assignments/${a.id}`}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 600,
                                                        ...(mode === 'liquid-glass' && status === 'PENDING' && {
                                                            bgcolor: 'rgba(255,255,255,0.2)',
                                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                                        }),
                                                        ...(mode === 'liquid-glass' && status !== 'PENDING' && {
                                                            color: TEXT_COLOR,
                                                            borderColor: 'rgba(255,255,255,0.4)',
                                                            '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                                                        })
                                                    }}
                                                >
                                                    {status === 'PENDING' ? 'Submit' : 'View'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
