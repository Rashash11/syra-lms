'use client';

import React from 'react';
import {
    Box, Typography, Card, CardContent, Button, Chip, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, useTheme, Grid
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useThemeMode } from '@shared/theme/ThemeContext';

interface Certificate {
    id: string;
    courseName: string;
    issuedAt: string;
    validUntil: string | null;
    credentialId: string;
    status: 'active' | 'expired';
}

const myCertificates: Certificate[] = [
    { id: '1', courseName: 'Node.js Backend Development', issuedAt: 'Dec 10, 2024', validUntil: 'Dec 10, 2026', credentialId: 'CERT-2024-NJS-001', status: 'active' },
    { id: '2', courseName: 'Python for Data Science', issuedAt: 'Nov 15, 2024', validUntil: null, credentialId: 'CERT-2024-PDS-002', status: 'active' },
];

export default function CertificatesPage() {
    const { mode } = useThemeMode();
    const theme = useTheme();

    const TEXT_COLOR = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.9)' : 'inherit';
    const ICON_COLOR = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : 'primary.main';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'divider';

    return (
        <Box sx={{ color: TEXT_COLOR }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>My Certificates</Typography>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6 }}>
                    <Paper sx={{
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
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
                        <Box sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : 'success.lighter',
                            color: mode === 'liquid-glass' ? 'white' : 'success.main'
                        }}>
                            <CardMembershipIcon />
                        </Box>
                        <Box>
                            <Typography variant="h4" fontWeight={700}>{myCertificates.length}</Typography>
                            <Typography variant="body2" color={mode === 'liquid-glass' ? 'rgba(255,255,255,0.6)' : 'text.secondary'}>Certificates Earned</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <Paper sx={{
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
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
                        <Box sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : 'info.lighter',
                            color: mode === 'liquid-glass' ? 'white' : 'info.main'
                        }}>
                            <VerifiedIcon />
                        </Box>
                        <Box>
                            <Typography variant="h4" fontWeight={700}>{myCertificates.filter(c => c.status === 'active').length}</Typography>
                            <Typography variant="body2" color={mode === 'liquid-glass' ? 'rgba(255,255,255,0.6)' : 'text.secondary'}>Active Credentials</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Certificates Grid */}
            <Grid container spacing={3}>
                {myCertificates.map((cert) => (
                    <Grid size={{ xs: 12, md: 6 }} key={cert.id}>
                        <Card sx={{
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : 'background.paper',
                            border: mode === 'liquid-glass' ? '1px solid rgba(255,255,255,0.4)' : 2,
                            borderColor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.4)' : 'divider',
                            ...(mode === 'liquid-glass' && {
                                backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                                boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
                                borderRadius: '24px',
                            })
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box>
                                        <Chip
                                            label="Certificate"
                                            size="small"
                                            sx={{
                                                mb: 1,
                                                bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.15)' : 'hsl(var(--primary) / 0.15)',
                                                color: mode === 'liquid-glass' ? 'white' : 'primary.main',
                                                border: mode === 'liquid-glass' ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                            }}
                                        />
                                        <Typography variant="h6" fontWeight={600} color={TEXT_COLOR}>{cert.courseName}</Typography>
                                    </Box>
                                    <VerifiedIcon sx={{ color: mode === 'liquid-glass' ? 'white' : 'primary.main', fontSize: 40 }} />
                                </Box>

                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color={mode === 'liquid-glass' ? 'rgba(255,255,255,0.6)' : "text.secondary"}>Issued</Typography>
                                        <Typography variant="body2" fontWeight={500} color={TEXT_COLOR}>{cert.issuedAt}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color={mode === 'liquid-glass' ? 'rgba(255,255,255,0.6)' : "text.secondary"}>Valid Until</Typography>
                                        <Typography variant="body2" fontWeight={500} color={TEXT_COLOR}>{cert.validUntil || 'No Expiration'}</Typography>
                                    </Grid>
                                </Grid>

                                <Box sx={{
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.05)' : 'hsl(var(--card))',
                                    p: 1.5,
                                    borderRadius: 1,
                                    mb: 2,
                                    border: mode === 'liquid-glass' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                }}>
                                    <Typography variant="caption" color={mode === 'liquid-glass' ? 'rgba(255,255,255,0.6)' : "text.secondary"}>Credential ID</Typography>
                                    <Typography variant="body2" fontFamily="monospace" color={TEXT_COLOR}>{cert.credentialId}</Typography>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<DownloadIcon />}
                                        fullWidth
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            ...(mode === 'liquid-glass' && {
                                                bgcolor: 'rgba(255,255,255,0.2)',
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                            })
                                        }}
                                    >
                                        Download PDF
                                    </Button>
                                    <IconButton sx={{ color: TEXT_COLOR }}><ShareIcon /></IconButton>
                                    <IconButton sx={{ color: TEXT_COLOR }}><VisibilityIcon /></IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {myCertificates.length === 0 && (
                <Paper sx={{
                    p: 6,
                    textAlign: 'center',
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
                    <CardMembershipIcon sx={{ fontSize: 64, color: mode === 'liquid-glass' ? 'rgba(255,255,255,0.2)' : 'grey.400' }} />
                    <Typography variant="h6" color={TEXT_COLOR} sx={{ mt: 2 }}>No certificates yet</Typography>
                    <Typography variant="body2" color={mode === 'liquid-glass' ? 'rgba(255,255,255,0.6)' : "text.secondary"}>Complete courses to earn certificates</Typography>
                    <Button
                        variant="contained"
                        sx={{
                            mt: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            ...(mode === 'liquid-glass' && {
                                bgcolor: 'rgba(255,255,255,0.2)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                            })
                        }}
                    >
                        Browse Courses
                    </Button>
                </Paper>
            )}
        </Box>
    );
}
