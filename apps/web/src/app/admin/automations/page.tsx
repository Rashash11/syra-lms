'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    CircularProgress,
    IconButton,
    Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { apiFetch } from '@shared/http/apiFetch';
import { GlassCard } from '@shared/ui/components/GlassCard';
import { useThemeMode } from '@/shared/theme/ThemeContext';

type AutomationType = 'assign_course' | 'send_notification' | 'deactivate_user' | 'webhook' | 'assign_badge';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';

interface Automation {
    id: string;
    name: string;
    type: AutomationType;
    enabled: boolean;
    runCount?: number;
};

const automationTypeLabels: Record<AutomationType, string> = {
    assign_course: 'Assign course',
    send_notification: 'Send notification',
    deactivate_user: 'Deactivate user',
    webhook: 'Webhook',
    assign_badge: 'Assign badge',
};

export default function AutomationsPage() {
    const { mode } = useThemeMode();
    const [automations, setAutomations] = useState<Automation[]>([]);

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const [loading, setLoading] = useState(true);
    const [mutatingIds, setMutatingIds] = useState<Record<string, boolean>>({});
    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<AutomationType>('send_notification');
    const [enabled, setEnabled] = useState(true);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const loadAutomations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch<{ data: Automation[] }>('/api/automations?page=1&limit=100', { credentials: 'include' });
            setAutomations(res.data || []);
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to load automations', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAutomations();
    }, [loadAutomations]);

    const stats = useMemo(() => {
        const total = automations.length;
        const active = automations.filter(a => a.enabled).length;
        const runs = automations.reduce((sum, a) => sum + (a.runCount || 0), 0);
        return { total, active, runs };
    }, [automations]);

    const resetCreateForm = () => {
        setName('');
        setType('send_notification');
        setEnabled(true);
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            setSnackbar({ open: true, message: 'Name is required', severity: 'error' });
            return;
        }

        setCreating(true);
        try {
            await apiFetch('/api/automations', {
                method: 'POST',
                credentials: 'include',
                body: {
                    name: name.trim(),
                    type,
                    parameters: {},
                    enabled,
                },
            });
            setSnackbar({ open: true, message: 'Automation created', severity: 'success' });
            setCreateOpen(false);
            resetCreateForm();
            await loadAutomations();
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to create automation', severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const toggleEnabled = async (automation: Automation, nextEnabled: boolean) => {
        setMutatingIds(prev => ({ ...prev, [automation.id]: true }));
        try {
            await apiFetch('/api/automations', {
                method: 'PATCH',
                credentials: 'include',
                body: { ids: [automation.id], enabled: nextEnabled },
            });
            setAutomations(prev => prev.map(a => (a.id === automation.id ? { ...a, enabled: nextEnabled } : a)));
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to update automation', severity: 'error' });
        } finally {
            setMutatingIds(prev => ({ ...prev, [automation.id]: false }));
        }
    };

    const deleteAutomation = async (automation: Automation) => {
        setMutatingIds(prev => ({ ...prev, [automation.id]: true }));
        try {
            await apiFetch('/api/automations', {
                method: 'DELETE',
                credentials: 'include',
                body: { ids: [automation.id] },
            });
            setAutomations(prev => prev.filter(a => a.id !== automation.id));
            setSnackbar({ open: true, message: 'Automation deleted', severity: 'success' });
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to delete automation', severity: 'error' });
        } finally {
            setMutatingIds(prev => ({ ...prev, [automation.id]: false }));
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: TEXT_COLOR }}>
                    <AutoFixHighIcon fontSize="large" sx={{ color: ICON_COLOR }} />
                    Automations
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateOpen(true)}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: ICON_COLOR,
                        color: 'hsl(var(--primary-foreground))',
                        borderRadius: '6px',
                        px: 3,
                        '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                    }}
                >
                    Create Automation
                </Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { label: 'Total Rules', value: stats.total, icon: <AutoFixHighIcon />, color: ICON_COLOR },
                    { label: 'Active', value: stats.active, icon: <PlayArrowIcon />, color: 'hsl(var(--success))' },
                    { label: 'Total Runs', value: stats.runs, icon: <HistoryIcon />, color: 'hsl(var(--info))' },
                ].map((stat, i) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={i}>
                        <GlassCard sx={{ height: '100%', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: stat.color.startsWith('hsl') ? `${stat.color.replace(')', '')} / 0.15)` : `hsl(var(--${stat.color}) / 0.15)`,
                                    color: stat.color.startsWith('hsl') ? stat.color : `hsl(var(--${stat.color}))`,
                                    display: 'flex'
                                }}>
                                    {stat.icon}
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                                        {stat.label}
                                    </Typography>
                                    <Typography variant="h5" sx={{ color: TEXT_COLOR, fontWeight: 700 }}>
                                        {stat.value}
                                    </Typography>
                                </Box>
                            </Box>
                        </GlassCard>
                    </Grid>
                ))}
            </Grid>

            <GlassCard p={0} sx={{ border: '1px solid rgba(141, 166, 166, 0.1)', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(141, 166, 166, 0.05)' }}>
                                <TableCell sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Automation</TableCell>
                                <TableCell sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Type</TableCell>
                                <TableCell align="center" sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Runs</TableCell>
                                <TableCell align="center" sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Enabled</TableCell>
                                <TableCell align="right" sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                                            <CircularProgress size={18} sx={{ color: ICON_COLOR }} />
                                            <Typography variant="body2" sx={{ color: MUTED_TEXT }}>Loading automations…</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : automations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: MUTED_TEXT, borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                        No automations yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                automations.map((rule) => {
                                    const busy = Boolean(mutatingIds[rule.id]);
                                    return (
                                        <TableRow key={rule.id} hover sx={{ '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.05)' } }}>
                                            <TableCell sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                                <Typography variant="body2" fontWeight={600} sx={{ color: TEXT_COLOR }}>{rule.name}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                                <Chip
                                                    label={automationTypeLabels[rule.type] || rule.type}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ borderColor: 'rgba(141, 166, 166, 0.2)', color: TEXT_COLOR, bgcolor: 'rgba(141, 166, 166, 0.05)' }}
                                                />
                                            </TableCell>
                                            <TableCell align="center" sx={{ color: TEXT_COLOR, borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>{rule.runCount || 0}</TableCell>
                                            <TableCell align="center" sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                                <Switch
                                                    checked={Boolean(rule.enabled)}
                                                    onChange={(e) => toggleEnabled(rule, e.target.checked)}
                                                    disabled={busy}
                                                    size="small"
                                                    sx={{
                                                        '& .MuiSwitch-switchBase.Mui-checked': { color: ICON_COLOR },
                                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: ICON_COLOR },
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                                <IconButton
                                                    aria-label="Delete automation"
                                                    onClick={() => deleteAutomation(rule)}
                                                    disabled={busy}
                                                    sx={{ color: MUTED_TEXT, '&:hover': { color: 'hsl(var(--destructive))', bgcolor: 'hsl(var(--destructive) / 0.1)' } }}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </GlassCard>

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
                            bgcolor: 'hsl(var(--card))',
                            borderRadius: '12px',
                        }),
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle>Create automation</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            autoFocus
                        />
                        <FormControl fullWidth>
                            <InputLabel id="automation-type-label">Type</InputLabel>
                            <Select
                                labelId="automation-type-label"
                                value={type}
                                label="Type"
                                onChange={(e) => setType(e.target.value as AutomationType)}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            ...glassStyle,
                                            ...(mode === 'liquid-glass' ? {
                                                borderRadius: '24px',
                                            } : {
                                                bgcolor: 'hsl(var(--card))',
                                                backdropFilter: 'blur(20px)',
                                                border: `1px solid rgba(141, 166, 166, 0.1)`,
                                                borderRadius: 2,
                                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                            })
                                        }
                                    }
                                }}
                            >
                                {Object.entries(automationTypeLabels).map(([key, label]) => (
                                    <MenuItem key={key} value={key}>{label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Enabled</Typography>
                            <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setCreateOpen(false);
                            resetCreateForm();
                        }}
                        disabled={creating}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={creating} variant="contained">
                        {creating ? 'Creating…' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
