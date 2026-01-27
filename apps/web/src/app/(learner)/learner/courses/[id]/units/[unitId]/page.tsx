'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    CircularProgress,
    Typography,
    IconButton,
    Button,
    Paper,
    Divider,
    useTheme
} from '@mui/material';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import UnitRenderer from '@modules/courses/player/UnitRenderer';
import LearnerCourseOutline from '@modules/courses/ui/LearnerCourseOutline';
import { apiFetch } from '@shared/http/apiFetch';
import { useThemeMode } from '@shared/theme/ThemeContext';

function CoursePlayerContent() {
    const { mode } = useThemeMode();
    const theme = useTheme();
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;
    const unitId = params.unitId as string;

    const TEXT_COLOR = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.9)' : 'inherit';
    const ICON_COLOR = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : 'inherit';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'divider';
    const BAR_BG = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'background.paper';

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<any>(null);
    const [unit, setUnit] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [enrollment, setEnrollment] = useState<any>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const enrollRes = await apiFetch<any>('/api/learner/enrollments');
            if (enrollRes) {
                const data = Array.isArray(enrollRes) ? enrollRes : (enrollRes.data || enrollRes.enrollments || []);
                const userEnrollment = data.find((e: any) => e.courseId === courseId);

                if (!userEnrollment) {
                    setEnrollment({ percent: 0, completedUnitIds: [] });
                } else {
                    try {
                        const progressData = await apiFetch<any>(`/api/learner/progress?courseId=${courseId}`);
                        setEnrollment({
                            ...userEnrollment,
                            ...progressData
                        });
                    } catch {
                        setEnrollment(userEnrollment);
                    }
                }
                const courseData = await apiFetch<any>(`/api/courses/${courseId}`);
                setCourse(courseData);

                if (unitId === 'overview') {
                    // Find first unit and redirect
                    const allUnits: any[] = [];
                    (courseData.sections || []).forEach((s: any) => allUnits.push(...s.units));
                    allUnits.push(...(courseData.unassignedUnits || []));
                    const sorted = allUnits.sort((a, b) => a.orderIndex - b.orderIndex);

                    if (sorted.length > 0) {
                        router.replace(`/learner/courses/${courseId}/units/${sorted[0].id}`);
                        return; // Exit as we are redirecting
                    }
                }

                if (unitId !== 'overview') {
                    setUnit(await apiFetch(`/api/courses/${courseId}/units/${unitId}`));
                }
            } else {
                router.push('/learner/courses');
            }
        } catch (err) {
            console.error('LoadData failed:', err);
            router.push('/learner/courses');
        } finally {
            setLoading(false);
        }
    }, [courseId, router, unitId]);

    useEffect(() => {
        if (courseId && unitId) {
            void loadData();
        }
    }, [courseId, loadData, unitId]);

    // Track last accessed unit
    useEffect(() => {
        if (courseId && unitId) {
            apiFetch(`/api/learner/courses/${courseId}/last-unit`, {
                method: 'POST',
                body: { unitId },
            }).catch(() => undefined);
        }
    }, [courseId, unitId]);

    const getAllUnits = () => {
        if (!course) return [];
        const units: any[] = [];
        (course.sections || []).forEach((s: any) => {
            units.push(...s.units);
        });
        units.push(...(course.unassignedUnits || []));
        return units.sort((a, b) => a.orderIndex - b.orderIndex);
    };

    const units = getAllUnits();
    const currentIndex = units.findIndex(u => u.id === unitId);
    const prevUnit = currentIndex > 0 ? units[currentIndex - 1] : null;
    const nextUnit = currentIndex < units.length - 1 ? units[currentIndex + 1] : null;

    const handleNavigate = (id: string) => {
        // Sequential check
        const targetIndex = units.findIndex(u => u.id === id);
        if (targetIndex > currentIndex) {
            // Check if all previous units are completed
            for (let i = 0; i < targetIndex; i++) {
                if (!enrollment?.completedUnitIds?.includes(units[i].id)) {
                    // Locked
                    return;
                }
            }
        }
        router.push(`/learner/courses/${courseId}/units/${id}`);
    };

    const handleMarkComplete = async () => {
        if (!unit || unitId === 'overview') return;
        try {
            const data = await apiFetch<{ percent: number }>(
                `/api/learner/progress/units/${unitId}/complete`,
                { method: 'POST' }
            );
            setEnrollment((prev: any) => ({
                ...prev,
                percent: data.percent,
                completedUnitIds: [...(prev.completedUnitIds || []), unitId],
            }));
        } catch {
            setEnrollment((prev: any) => {
                const total = units.length || 1;
                const step = Math.max(1, Math.floor(100 / total));
                return {
                    ...prev,
                    percent: Math.min(100, (prev?.percent || 0) + step),
                    completedUnitIds: [...(prev?.completedUnitIds || []), unitId],
                };
            });
        }
        if (nextUnit) {
            router.push(`/learner/courses/${courseId}/units/${nextUnit.id}`);
        } else {
            router.push('/learner/courses');
        }
    };

    const isCurrentUnitCompleted = enrollment?.completedUnitIds?.includes(unitId);
    const canGoNext = isCurrentUnitCompleted || (nextUnit === null);

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                bgcolor: mode === 'liquid-glass' ? 'rgba(0,0,0,0.8)' : 'background.default',
                position: 'fixed',
                inset: 0,
                zIndex: 10000,
                ...(mode === 'liquid-glass' && {
                    backdropFilter: 'blur(10px)'
                })
            }}>
                <CircularProgress color={mode === 'liquid-glass' ? 'inherit' : 'primary'} />
            </Box>
        );
    }

    if (!course || !unit) {
        return <Box sx={{ p: 4, color: TEXT_COLOR }}><Typography>Course or Unit not found</Typography></Box>;
    }

    return (
        <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            bgcolor: mode === 'liquid-glass' ? 'transparent' : 'background.default',
            zIndex: 9999, // Overlays everything
            overflow: 'hidden',
            ...(mode === 'liquid-glass' && {
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.3)',
                    zIndex: -1
                }
            })
        }}>
            {/* Top Bar - More compact and integrated */}
            <Box sx={{
                height: 50,
                bgcolor: BAR_BG,
                display: 'flex',
                alignItems: 'center',
                px: 2,
                color: TEXT_COLOR,
                borderBottom: '1px solid',
                borderColor: DIVIDER,
                justifyContent: 'space-between',
                zIndex: 1200,
                ...(mode === 'liquid-glass' && {
                    backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                })
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton size="small" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <MenuIcon sx={{ color: ICON_COLOR }} />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 800, color: TEXT_COLOR }}>
                        {course.title}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                        size="small"
                        disabled={!prevUnit}
                        startIcon={<NavigateBeforeIcon />}
                        onClick={() => prevUnit && handleNavigate(prevUnit.id)}
                        variant={mode === 'liquid-glass' ? "text" : "outlined"}
                        sx={{
                            textTransform: 'none',
                            px: 2,
                            py: 0.5,
                            fontSize: '0.8rem',
                            color: mode === 'liquid-glass' ? TEXT_COLOR : 'primary.main',
                            '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' }
                        }}
                    >
                        Prev
                    </Button>

                    <Typography component="div" sx={{ fontSize: '0.8rem', color: mode === 'liquid-glass' ? 'rgba(255,255,255,0.6)' : '#718096', mx: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!isCurrentUnitCompleted && (
                            <>
                                <Box sx={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${mode === 'liquid-glass' ? 'rgba(255,255,255,0.4)' : '#718096'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Box sx={{ width: 8, height: 8, bgcolor: 'transparent' }} />
                                </Box>
                                Complete the unit to continue
                            </>
                        )}
                        {isCurrentUnitCompleted && (
                            <>
                                <CheckCircleIcon sx={{ fontSize: '1rem', color: '#38a169' }} />
                                Done
                            </>
                        )}
                    </Typography>

                    <Button
                        size="small"
                        disabled={!nextUnit || !canGoNext}
                        endIcon={<NavigateNextIcon />}
                        onClick={() => nextUnit && handleNavigate(nextUnit.id)}
                        variant="contained"
                        sx={{
                            textTransform: 'none',
                            px: 2,
                            py: 0.5,
                            fontSize: '0.8rem',
                            ...(mode === 'liquid-glass' && {
                                bgcolor: 'rgba(255,255,255,0.2)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                            })
                        }}
                    >
                        Next
                    </Button>

                    <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: DIVIDER }} />

                    <Button
                        size="small"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push('/learner/courses')}
                        sx={{
                            textTransform: 'none',
                            color: mode === 'liquid-glass' ? TEXT_COLOR : '#4a5568',
                            fontWeight: 600,
                            '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : 'transparent' }
                        }}
                    >
                        Exit
                    </Button>
                </Box>
            </Box>
            <Box sx={{ px: 2, borderBottom: '1px solid', borderColor: DIVIDER, bgcolor: BAR_BG }}>
                <Tabs
                    value={0}
                    sx={{
                        minHeight: 40,
                        '& .MuiTab-root': {
                            minHeight: 40,
                            color: mode === 'liquid-glass' ? 'rgba(255,255,255,0.6)' : 'inherit',
                            '&.Mui-selected': { color: mode === 'liquid-glass' ? TEXT_COLOR : 'primary.main' }
                        },
                        '& .MuiTabs-indicator': {
                            bgcolor: mode === 'liquid-glass' ? TEXT_COLOR : 'primary.main'
                        }
                    }}
                >
                    <Tab label="Completed" />
                </Tabs>
            </Box>

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                {sidebarOpen && (
                    <Box sx={{
                        width: 280,
                        minWidth: 280,
                        borderRight: '1px solid',
                        borderColor: DIVIDER,
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: BAR_BG,
                        ...(mode === 'liquid-glass' && {
                            backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                        })
                    }}>
                        <LearnerCourseOutline
                            sections={course.sections || []}
                            unassignedUnits={course.unassignedUnits || []}
                            activeUnitId={unitId}
                            onUnitClick={handleNavigate}
                            courseTitle={course.title}
                            onBack={() => router.push('/learner/courses')}
                            progress={enrollment?.percent || 0}
                            completedUnitIds={enrollment?.completedUnitIds || []}
                        />
                    </Box>
                )}

                {/* Content */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.05)' : 'background.paper',
                    ...(mode === 'liquid-glass' && {
                        backdropFilter: 'blur(5px)'
                    })
                }}>
                    <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>
                        <Box sx={{ maxWidth: 1000, mx: 'auto', color: TEXT_COLOR }}>
                            <UnitRenderer unit={{ ...unit, content: unit.config }} />

                            {/* Bottom Mark Complete */}
                            {!isCurrentUnitCompleted && (
                                <Box sx={{ mt: 6, mb: 10, display: 'flex', justifyContent: 'center' }}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        size="large"
                                        startIcon={<CheckCircleIcon />}
                                        onClick={handleMarkComplete}
                                        sx={{
                                            textTransform: 'none',
                                            px: 6,
                                            py: 1.5,
                                            fontSize: '1.1rem',
                                            borderRadius: 1,
                                            ...(mode === 'liquid-glass' && {
                                                bgcolor: 'success.main',
                                                '&:hover': { bgcolor: 'success.dark' }
                                            })
                                        }}
                                    >
                                        Mark as Complete
                                    </Button>
                                </Box>
                            )}
                            {isCurrentUnitCompleted && nextUnit && (
                                <Box sx={{ mt: 6, mb: 10, display: 'flex', justifyContent: 'center' }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        endIcon={<NavigateNextIcon />}
                                        onClick={() => handleNavigate(nextUnit.id)}
                                        color="primary"
                                        sx={{
                                            textTransform: 'none',
                                            px: 6,
                                            py: 1.5,
                                            fontSize: '1.1rem',
                                            borderRadius: 1,
                                            ...(mode === 'liquid-glass' && {
                                                bgcolor: 'rgba(255,255,255,0.2)',
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                            })
                                        }}
                                    >
                                        Continue to Next Unit
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default function LearnerCoursePlayer() {
    return (
        <Suspense fallback={<CircularProgress />}>
            <CoursePlayerContent />
        </Suspense>
    );
}
