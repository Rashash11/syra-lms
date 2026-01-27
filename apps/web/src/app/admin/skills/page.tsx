'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    TextField,
    InputAdornment,
    Avatar,
    Switch,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Snackbar,
    Alert,
} from '@mui/material';
import { GlassCard } from '@/shared/ui/components/GlassCard';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';
import SearchIcon from '@mui/icons-material/Search';
import { usePermissions } from '@/hooks/usePermissions';
import { useApiError } from '@/hooks/useApiError';
import AccessDenied from '@shared/ui/components/AccessDenied';
import AddIcon from '@mui/icons-material/Add';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import QuizIcon from '@mui/icons-material/Quiz';
import { useThemeMode } from '@/shared/theme/ThemeContext';
import { apiFetch } from '@shared/http/apiFetch';

export default function SkillsPage() {
    const { mode } = useThemeMode();
    const [search, setSearch] = useState('');
    
    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const [skillsData, setSkillsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { can, loading: permissionsLoading } = usePermissions();
    const { handleResponse } = useApiError();
    const [forbidden, setForbidden] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const fetchSkills = useCallback(async () => {
        try {
            const res = await fetch('/api/skills');
            if (res.status === 403) {
                setForbidden(true);
                return;
            }
            if (handleResponse(res)) return;
            const data = await res.json();
            setSkillsData(data.data || []);
        } catch (error) {
            console.error('Failed to fetch skills:', error);
        } finally {
            setLoading(false);
        }
    }, [handleResponse]);

    useEffect(() => {
        if (!permissionsLoading && can('skills:read')) {
            void fetchSkills();
        }
    }, [can, fetchSkills, permissionsLoading]);

    if (permissionsLoading) return null;
    if (!can('skills:read') || forbidden) {
        return <AccessDenied requiredPermission="skills:read" />;
    }
    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    const filteredSkills = skillsData.filter(skill =>
        skill.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newName.trim()) {
            setSnackbar({ open: true, message: 'Name is required', severity: 'error' });
            return;
        }

        setCreating(true);
        try {
            await apiFetch('/api/skills', {
                method: 'POST',
                credentials: 'include',
                body: {
                    name: newName.trim(),
                    description: newDescription.trim() || undefined,
                },
            });
            setSnackbar({ open: true, message: 'Skill created', severity: 'success' });
            setCreateOpen(false);
            setNewName('');
            setNewDescription('');
            setLoading(true);
            await fetchSkills();
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to create skill', severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT_COLOR, mb: 1, letterSpacing: '-0.02em' }}>
                        Skills
                    </Typography>
                    <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                        Define skills and let AI assess your learners
                    </Typography>
                </Box>
                {can('skills:create') && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateOpen(true)}
                        sx={{
                            bgcolor: ICON_COLOR,
                            color: 'white',
                            fontWeight: 700,
                            textTransform: 'none',
                            borderRadius: '12px',
                            px: 3,
                            height: 44,
                            boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)',
                            '&:hover': { 
                                bgcolor: 'hsl(var(--primary) / 0.9)',
                                boxShadow: '0 6px 20px rgba(26, 84, 85, 0.23)'
                            }
                        }}
                    >
                        Add Skill
                    </Button>
                )}
            </Box>

            {/* Info Banner */}
            <GlassCard 
                sx={{ 
                    p: 3, 
                    mb: 4, 
                    bgcolor: 'hsl(var(--primary) / 0.1)', 
                    border: `1px solid ${ICON_COLOR}20`,
                    borderRadius: 4
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box 
                        sx={{ 
                            width: 56, 
                            height: 56, 
                            borderRadius: 3, 
                            bgcolor: 'hsl(var(--primary) / 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${ICON_COLOR}30`
                        }}
                    >
                        <AutoFixHighIcon sx={{ color: ICON_COLOR, fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ color: ICON_COLOR, mb: 0.5 }}>
                            AI-Powered Skills Assessment
                        </Typography>
                        <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                            Enable AI to automatically generate questions and assess learner proficiency with high accuracy
                        </Typography>
                    </Box>
                </Box>
            </GlassCard>

            {/* Search */}
            <GlassCard 
                sx={{ 
                    p: 2, 
                    mb: 4, 
                    borderRadius: 3,
                    border: `1px solid ${DIVIDER}`
                }}
            >
                <TextField
                    placeholder="Search skills..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ 
                        width: 320,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            bgcolor: 'hsl(var(--card) / 0.2)',
                            border: `1px solid ${DIVIDER}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: ICON_COLOR,
                                bgcolor: 'hsl(var(--card) / 0.3)',
                            },
                            '&.Mui-focused': {
                                borderColor: ICON_COLOR,
                                boxShadow: `0 0 0 4px ${ICON_COLOR}20`,
                            }
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" sx={{ color: MUTED_TEXT }} />
                            </InputAdornment>
                        )
                    }}
                />
            </GlassCard>

            {/* Skills List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {filteredSkills.map((skill) => (
                    <GlassCard 
                        key={skill.id} 
                        sx={{ 
                            p: 3,
                            borderRadius: 4,
                            border: `1px solid ${DIVIDER}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 12px 24px -8px rgba(0,0,0,0.3)',
                                borderColor: 'hsl(var(--primary) / 0.3)'
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', gap: 3 }}>
                                <Avatar 
                                    sx={{ 
                                        bgcolor: 'hsl(var(--primary) / 0.1)', 
                                        color: ICON_COLOR, 
                                        width: 56, 
                                        height: 56,
                                        borderRadius: 3,
                                        border: `1px solid ${DIVIDER}`
                                    }}
                                >
                                    <EmojiObjectsIcon fontSize="large" />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_COLOR, mb: 0.5 }}>
                                        {skill.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: MUTED_TEXT, mb: 2, fontWeight: 500 }}>
                                        {skill.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Chip
                                            icon={<QuizIcon sx={{ fontSize: 16, color: ICON_COLOR }} />}
                                            label={`${skill.questionCount ?? skill.questions ?? 0} questions`}
                                            size="small"
                                            sx={{ 
                                                bgcolor: 'hsl(var(--card) / 0.5)', 
                                                color: TEXT_COLOR,
                                                fontWeight: 600,
                                                border: `1px solid ${DIVIDER}`
                                            }}
                                        />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: ICON_COLOR }} />
                                            <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 600 }}>
                                                {skill.userCount ?? skill.users ?? 0} users assessed
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={Boolean(skill.aiEnabled)} 
                                            size="small" 
                                            disabled 
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': { color: ICON_COLOR },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: ICON_COLOR }
                                            }}
                                        />
                                    }
                                    label={<Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 600 }}>AI enabled</Typography>}
                                    labelPlacement="start"
                                />
                                <Button 
                                    variant="outlined" 
                                    size="small" 
                                    disabled 
                                    sx={{ 
                                        color: MUTED_TEXT, 
                                        borderColor: DIVIDER,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        borderRadius: '8px'
                                    }}
                                >
                                    Manage
                                </Button>
                                <Button 
                                    variant="contained" 
                                    size="small" 
                                    startIcon={<PlayCircleOutlineIcon />} 
                                    disabled
                                    sx={{
                                        bgcolor: ICON_COLOR,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        borderRadius: '8px',
                                        px: 2
                                    }}
                                >
                                    Test
                                </Button>
                            </Box>
                        </Box>
                    </GlassCard>
                ))}
            </Box>

            {filteredSkills.length === 0 && (
                <GlassCard sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: `1px solid ${DIVIDER}` }}>
                    <Box 
                        sx={{ 
                            width: 80, 
                            height: 80, 
                            borderRadius: '50%', 
                            bgcolor: 'hsl(var(--card) / 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 3,
                            border: `1px solid ${DIVIDER}`
                        }}
                    >
                        <EmojiObjectsIcon sx={{ fontSize: 40, color: MUTED_TEXT, opacity: 0.5 }} />
                    </Box>
                    <Typography variant="h6" sx={{ color: TEXT_COLOR, fontWeight: 700, mb: 1 }}>
                        No skills found
                    </Typography>
                    <Typography variant="body2" sx={{ color: MUTED_TEXT, mb: 4 }}>
                        Start by creating your first skill to assess learner proficiency
                    </Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => setCreateOpen(true)}
                        sx={{
                            bgcolor: ICON_COLOR,
                            fontWeight: 700,
                            borderRadius: '12px',
                            px: 4
                        }}
                    >
                        Create your first skill
                    </Button>
                </GlassCard>
            )}

            <Dialog 
                open={createOpen} 
                onClose={() => setCreateOpen(false)} 
                fullWidth 
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        ...glassStyle,
                        ...(mode === 'liquid-glass' ? {
                            borderRadius: '24px',
                        } : {
                            bgcolor: 'hsl(var(--card) / 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${DIVIDER}`,
                            borderRadius: '24px',
                            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)',
                        }),
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle sx={{ color: TEXT_COLOR, fontWeight: 700, pb: 1 }}>
                    Create Skill
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                        <TextField 
                            label="Skill Name" 
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)} 
                            fullWidth 
                            autoFocus 
                            variant="outlined"
                            placeholder="e.g. Python Advanced"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    '& fieldset': { borderColor: DIVIDER },
                                    '&:hover fieldset': { borderColor: ICON_COLOR }
                                },
                                '& .MuiInputLabel-root': { color: MUTED_TEXT },
                                '& .MuiInputLabel-root.Mui-focused': { color: ICON_COLOR }
                            }}
                        />
                        <TextField
                            label="Description"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            fullWidth
                            multiline
                            minRows={4}
                            variant="outlined"
                            placeholder="Describe what this skill covers..."
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    '& fieldset': { borderColor: DIVIDER },
                                    '&:hover fieldset': { borderColor: ICON_COLOR }
                                },
                                '& .MuiInputLabel-root': { color: MUTED_TEXT },
                                '& .MuiInputLabel-root.Mui-focused': { color: ICON_COLOR }
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setCreateOpen(false)} disabled={creating} sx={{ color: MUTED_TEXT, fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleCreate} 
                        disabled={creating} 
                        variant="contained"
                        sx={{
                            borderRadius: '12px',
                            fontWeight: 700,
                            px: 3,
                            bgcolor: ICON_COLOR,
                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                        }}
                    >
                        {creating ? 'Creating…' : 'Create Skill'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    severity={snackbar.severity} 
                    variant="filled" 
                    sx={{ 
                        width: '100%',
                        borderRadius: '12px',
                        fontWeight: 600,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
