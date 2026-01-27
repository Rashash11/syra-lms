'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Card, CardContent, CardActions, Button, Chip,
    TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
    Paper, Avatar, Rating, Divider, CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import FilterListIcon from '@mui/icons-material/FilterList';
import Image from 'next/image';
import { apiFetch } from '@shared/http/apiFetch';
import { useThemeMode } from '@shared/theme/ThemeContext';

const TEXT_COLOR = 'hsl(var(--foreground))';
const ICON_COLOR = 'hsl(var(--primary))';
const DIVIDER = 'hsl(var(--border) / 0.1)';

interface CatalogCourse {
    id: string;
    code: string;
    title: string;
    description: string | null;
    image: string | null;
    introVideoUrl: string | null;
    enrollmentCount: number;
    capacity: number | null;
    isFull: boolean;
    isEnrolled: boolean;
    enrollmentStatus: string | null;
    progress: number;
}

interface Category {
    id: string;
    name: string;
}

export default function CatalogPage() {
    const router = useRouter();
    const { mode } = useThemeMode();
    const [courses, setCourses] = useState<CatalogCourse[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

    const fetchCatalog = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/catalog');
            if (!response.ok) throw new Error('Failed to fetch catalog');

            const data = await response.json();
            setCourses(data.data || []);
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Error fetching catalog:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCatalog();
    }, [fetchCatalog]);

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = categoryFilter === 'all';
        return matchesSearch && matchesCategory;
    });

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'success';
            case 'intermediate': return 'warning';
            case 'advanced': return 'error';
            default: return 'default';
        }
    };

    const handleEnroll = async (courseId: string) => {
        setEnrollingCourseId(courseId);
        try {
            await apiFetch(`/api/courses/${courseId}/enroll`, { method: 'POST', credentials: 'include' });
            await fetchCatalog();
        } finally {
            setEnrollingCourseId(null);
        }
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>Course Catalog</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Discover courses to enhance your skills
            </Typography>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth size="small" placeholder="Search courses..."
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="category-filter-label" sx={{ color: TEXT_COLOR }}>Category</InputLabel>
                            <Select
                                labelId="category-filter-label"
                                value={categoryFilter}
                                label="Category"
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                sx={{
                                    color: TEXT_COLOR,
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(141, 166, 166, 0.2)' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ICON_COLOR },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ICON_COLOR },
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            ...(mode === 'liquid-glass' ? {
                                                backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                                boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
                                                borderRadius: '24px',
                                            } : {
                                                bgcolor: 'hsl(var(--card) / 0.9)',
                                                backdropFilter: 'blur(10px)',
                                                border: `1px solid ${DIVIDER}`,
                                                borderRadius: '12px',
                                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                            }),
                                            '& .MuiMenuItem-root': {
                                                color: TEXT_COLOR,
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                px: 2,
                                                py: 1,
                                                '&:hover': {
                                                    bgcolor: 'hsl(var(--primary) / 0.1)',
                                                    color: ICON_COLOR
                                                },
                                                '&.Mui-selected': {
                                                    bgcolor: 'hsl(var(--primary) / 0.2)',
                                                    color: ICON_COLOR,
                                                    '&:hover': {
                                                        bgcolor: 'hsl(var(--primary) / 0.25)',
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }}
                            >
                                <MenuItem value="all">All Categories</MenuItem>
                                {categories.map((cat) => (
                                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Empty State */}
            {!loading && filteredCourses.length === 0 && (
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                    <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No courses available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Check back later for new courses or contact your administrator.
                    </Typography>
                </Paper>
            )}

            {/* Courses Grid */}
            {!loading && filteredCourses.length > 0 && (
                <Grid container spacing={3}>
                    {filteredCourses.map((course) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                {course.isEnrolled && (
                                    <Chip label="Enrolled" size="small" color="success" sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }} />
                                )}
                                {course.isFull && !course.isEnrolled && (
                                    <Chip label="Full" size="small" color="error" sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }} />
                                )}

                                {/* Course Image or Placeholder */}
                                <Box sx={{ height: 150, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                                    {course.image && (course.image.startsWith('http://') || course.image.startsWith('https://') || course.image.startsWith('/')) ? (
                                        <Image
                                            src={course.image}
                                            alt={course.title}
                                            fill
                                            sizes="(max-width: 600px) 100vw, 33vw"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <SchoolIcon sx={{ fontSize: 64, color: 'white', opacity: 0.5 }} />
                                    )}
                                </Box>

                                <CardContent sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5 }}>
                                        <Chip label={course.code} size="small" variant="outlined" />
                                    </Box>

                                    <Typography variant="h6" gutterBottom fontWeight={600}>
                                        {course.title}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 60 }}>
                                        {course.description ? (
                                            course.description.length > 100 ?
                                                course.description.slice(0, 100) + '...' :
                                                course.description
                                        ) : (
                                            'No description available'
                                        )}
                                    </Typography>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <PeopleIcon fontSize="small" color="action" />
                                            <Typography variant="caption">
                                                {course.enrollmentCount} {course.enrollmentCount === 1 ? 'student' : 'students'}
                                            </Typography>
                                        </Box>
                                        {course.capacity && (
                                            <Typography variant="caption" color="text.secondary">
                                                {course.capacity - course.enrollmentCount} spots left
                                            </Typography>
                                        )}
                                    </Box>

                                    {course.isEnrolled && course.progress > 0 && (
                                        <Box sx={{ mt: 1.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Progress: {course.progress}%
                                            </Typography>
                                            <Box sx={{ width: '100%', height: 4, bgcolor: 'grey.200', borderRadius: 1, mt: 0.5 }}>
                                                <Box sx={{ width: `${course.progress}%`, height: '100%', bgcolor: 'success.main', borderRadius: 1 }} />
                                            </Box>
                                        </Box>
                                    )}
                                </CardContent>

                                <CardActions sx={{ p: 2, pt: 0 }}>
                                    {course.isEnrolled ? (
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            onClick={() => router.push(`/learner/courses/${course.id}`)}
                                        >
                                            Go to Course
                                        </Button>
                                    ) : course.isFull ? (
                                        <Button variant="outlined" fullWidth disabled>Course Full</Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            startIcon={<AddIcon />}
                                            disabled={enrollingCourseId === course.id}
                                            onClick={() => handleEnroll(course.id)}
                                        >
                                            Enroll Now
                                        </Button>
                                    )}
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
