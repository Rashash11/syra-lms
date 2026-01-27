'use client';

import React from 'react';
import { Box, Avatar, AvatarGroup } from '@mui/material';
import { GlassCard } from './GlassCard';

export const GlassUserCard: React.FC = () => {
    return (
        <GlassCard
            title="Welcome back"
            subtitle="Here’s a quick snapshot of your team’s activity"
            action={
                <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.875rem' } }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>JD</Avatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>AS</Avatar>
                    <Avatar sx={{ bgcolor: 'success.main' }}>MB</Avatar>
                    <Avatar sx={{ bgcolor: 'info.main' }}>XL</Avatar>
                </AvatarGroup>
            }
        >
            <Box />
        </GlassCard>
    );
}
