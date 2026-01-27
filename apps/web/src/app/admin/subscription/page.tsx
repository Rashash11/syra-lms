'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Button, Chip,
    LinearProgress, List, ListItem, ListItemIcon, ListItemText, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { GlassCard } from '@/shared/ui/components/GlassCard';
import { useThemeMode } from '@/shared/theme/ThemeContext';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';
const SUCCESS_COLOR_MAIN = 'hsl(var(--success))';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import PeopleIcon from '@mui/icons-material/People';
import StorageIcon from '@mui/icons-material/Storage';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ScheduleIcon from '@mui/icons-material/Schedule';

const currentPlan = {
    name: 'Free Trial',
    daysLeft: 14,
    users: 6,
    maxUsers: 5,
    storage: '0.5 GB',
    maxStorage: '1 GB',
};

const features = [
    { name: 'Unlimited courses', included: true },
    { name: 'Course store access', included: true },
    { name: 'Basic reports', included: true },
    { name: 'Email support', included: true },
    { name: 'Custom branding', included: false },
    { name: 'API access', included: false },
    { name: 'SSO integration', included: false },
    { name: 'Priority support', included: false },
];

const plans = [
    { name: 'Starter', price: 69, users: 40, features: ['Unlimited courses', 'Basic reports', 'Email support'] },
    { name: 'Basic', price: 149, users: 100, features: ['Everything in Starter', 'Custom branding', 'API access'] },
    { name: 'Plus', price: 279, users: 500, features: ['Everything in Basic', 'SSO', 'Priority support'] },
    { name: 'Premium', price: 459, users: 1000, features: ['Everything in Plus', 'Dedicated manager', 'SLA'] },
];

export default function SubscriptionPage() {
    const { mode } = useThemeMode();
    const [showComingSoon, setShowComingSoon] = useState(false);

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};
    return (
        <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>Subscription</Typography>

            {/* Current Plan */}
            <GlassCard sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6" fontWeight={600} sx={{ color: TEXT_COLOR }}>{currentPlan.name}</Typography>
                            <Chip
                                icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                                label={`${currentPlan.daysLeft} days left`}
                                size="small"
                                color="warning"
                                sx={{ fontWeight: 600 }}
                            />
                        </Box>
                        <Typography variant="body2" sx={{ color: MUTED_TEXT }}>
                            Your trial expires in {currentPlan.daysLeft} days. Upgrade now to keep your data.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<RocketLaunchIcon />}
                        size="large"
                        onClick={() => setShowComingSoon(true)}
                        sx={{ opacity: 0.7 }}
                    >
                        Upgrade now
                    </Button>
                </Box>

                <Divider sx={{ my: 2, borderColor: DIVIDER }} />

                {/* Usage Stats */}
                <Box sx={{ display: 'flex', gap: 4 }}>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PeopleIcon sx={{ color: MUTED_TEXT }} />
                            <Typography variant="body2" sx={{ color: MUTED_TEXT }}>Users</Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={600} sx={{ color: TEXT_COLOR }}>{currentPlan.users} / {currentPlan.maxUsers}</Typography>
                        <LinearProgress
                            variant="determinate"
                            value={(currentPlan.users / currentPlan.maxUsers) * 100}
                            sx={{ mt: 1, height: 8, borderRadius: 4, bgcolor: DIVIDER }}
                            color={currentPlan.users > currentPlan.maxUsers ? 'error' : 'primary'}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <StorageIcon sx={{ color: MUTED_TEXT }} />
                            <Typography variant="body2" sx={{ color: MUTED_TEXT }}>Storage</Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={600} sx={{ color: TEXT_COLOR }}>{currentPlan.storage} / {currentPlan.maxStorage}</Typography>
                        <LinearProgress
                            variant="determinate"
                            value={50}
                            sx={{ mt: 1, height: 8, borderRadius: 4, bgcolor: DIVIDER }}
                        />
                    </Box>
                </Box>
            </GlassCard>

            {/* Current Features */}
            <GlassCard sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: TEXT_COLOR }}>Current plan features</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {features.map((feature) => (
                        <Chip
                            key={feature.name}
                            icon={feature.included ? <CheckCircleIcon sx={{ color: SUCCESS_COLOR_MAIN }} /> : undefined}
                            label={feature.name}
                            variant={feature.included ? 'filled' : 'outlined'}
                            sx={{
                                bgcolor: feature.included ? `${SUCCESS_COLOR_MAIN}1a` : 'transparent',
                                color: feature.included ? SUCCESS_COLOR_MAIN : MUTED_TEXT,
                                textDecoration: feature.included ? 'none' : 'line-through',
                                border: feature.included ? `1px solid ${SUCCESS_COLOR_MAIN}33` : `1px solid ${DIVIDER}`,
                                fontWeight: feature.included ? 600 : 400
                            }}
                        />
                    ))}
                </Box>
            </GlassCard>

            {/* Available Plans */}
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: TEXT_COLOR }}>Available plans</Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {plans.map((plan) => (
                    <GlassCard key={plan.name} sx={{
                        width: 250,
                        display: 'flex',
                        flexDirection: 'column',
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            borderRadius: '24px',
                        } : {})
                    }}>
                        <Box sx={{ p: 2, flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight={600} sx={{ color: TEXT_COLOR }}>{plan.name}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, my: 2 }}>
                                <Typography variant="h4" fontWeight={700} sx={{ color: ICON_COLOR }}>${plan.price}</Typography>
                                <Typography variant="body2" sx={{ color: MUTED_TEXT }}>/month</Typography>
                            </Box>
                            <Chip
                                label={`Up to ${plan.users} users`}
                                size="small"
                                sx={{
                                    mb: 2,
                                    bgcolor: DIVIDER,
                                    color: MUTED_TEXT,
                                    fontWeight: 600
                                }}
                            />
                            <List dense disablePadding>
                                {plan.features.map((feature) => (
                                    <ListItem key={feature} disablePadding sx={{ py: 0.5 }}>
                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                            <CheckCircleIcon sx={{ fontSize: 16, color: SUCCESS_COLOR_MAIN }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={feature}
                                            primaryTypographyProps={{ fontSize: 13, color: TEXT_COLOR }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                        <Box sx={{ p: 2, pt: 0 }}>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => setShowComingSoon(true)}
                                sx={{ borderColor: DIVIDER, color: TEXT_COLOR, opacity: 0.7 }}
                            >
                                Select plan
                            </Button>
                        </Box>
                    </GlassCard>
                ))}
            </Box>

            {/* Coming Soon Dialog */}
            <Dialog
                open={showComingSoon}
                onClose={() => setShowComingSoon(false)}
                PaperProps={{
                    sx: {
                        bgcolor: 'hsl(var(--card))',
                        borderRadius: 3,
                        p: 1,
                    }
                }}
            >
                <DialogTitle sx={{ color: TEXT_COLOR, fontWeight: 700, textAlign: 'center' }}>
                    🚀 Coming Soon!
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: MUTED_TEXT, textAlign: 'center' }}>
                        Subscription management is currently under development and will be available in a future update.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={() => setShowComingSoon(false)}
                        sx={{ px: 4 }}
                    >
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
