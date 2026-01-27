'use client';

import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { GlassCard } from '@/shared/ui/components/GlassCard';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import { useRouter } from 'next/navigation';
import Link from '@shared/ui/AppLink';

export default function ForbiddenPage() {
    const router = useRouter();

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    mt: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
                <GlassCard
                    sx={{
                        p: 5,
                        borderRadius: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <LockPersonIcon sx={{ fontSize: 80, color: '#ef4444', mb: 2, opacity: 0.8 }} />
                    <Typography variant="h3" fontWeight={700} gutterBottom sx={{ color: '#ef4444' }}>
                        403
                    </Typography>
                    <Typography variant="h5" fontWeight={600} gutterBottom sx={{ color: TEXT_COLOR }}>
                        Forbidden Access
                    </Typography>
                    <Typography variant="body1" sx={{ color: MUTED_TEXT, mb: 4 }}>
                        You don't have the necessary permissions to access this page.
                        Please contact your administrator if you believe this is an error.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => router.back()}
                            sx={{ borderRadius: 2, px: 4, borderColor: 'rgba(141, 166, 166, 0.2)', color: TEXT_COLOR }}
                        >
                            Go Back
                        </Button>
                        <Button
                            component={Link}
                            href="/admin"
                            variant="contained"
                            sx={{ borderRadius: 2, px: 4 }}
                        >
                            Go Home
                        </Button>
                    </Box>
                </GlassCard>
            </Box>
        </Container>
    );
}
