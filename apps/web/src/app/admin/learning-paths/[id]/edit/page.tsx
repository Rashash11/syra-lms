'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, IconButton, TextField, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem,
    ListItemText, ListItemButton, CircularProgress, Snackbar, Alert, Tooltip, Drawer,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LockIcon from '@mui/icons-material/Lock';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import AddCourseModal from './components/AddCourseModal';
import LearningPathOptionsPanel from './components/LearningPathOptionsPanel';
import UsersPanel from './components/UsersPanel';
import { getCsrfToken } from '@/lib/client-csrf';
import { apiFetch } from '@shared/http/apiFetch';
import { GlassCard } from '@/shared/ui/components/GlassCard';
import { useToast } from '@/shared/providers/ToastProvider';

interface Course {
    id: string;
    title: string;
    code: string;
}

interface LearningPathCourse {
    id: string;
    courseId: string;
    order: number;
    sectionId: string | null;
    unlockType: string;
    unlockCourseId: string | null;
    minScore: number | null;
    course: Course;
}

interface Section {
    id: string;
    name: string;
    order: number;
    courses: LearningPathCourse[];
}

interface LearningPath {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    image: string | null;
    category: string | null;
    status: string;
    isActive: boolean;
    courses: LearningPathCourse[];
    sections?: Section[];
}

export default function EditLearningPathPage() {
    console.log('[EditPage] rendering');
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;

    // Detect if we're in instructor or admin route
    const pathname_str = typeof window !== 'undefined' ? window.location.pathname : '';
    const isInstructorRoute = pathname_str.includes('/instructor/');
    const basePath = isInstructorRoute ? '/instructor/learning-paths' : '/admin/learning-paths';

    const [path, setPath] = useState<LearningPath | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCourseDialog, setShowCourseDialog] = useState(false);
    const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
    const [showUsersDrawer, setShowUsersDrawer] = useState(false);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [editingSectionName, setEditingSectionName] = useState('');
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const { showToast } = useToast();
    const [refreshKey, setRefreshKey] = useState(0);
    const didApplyDeepLink = useRef(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const SortableCourse = ({ id, children }: { id: string, children: React.ReactNode }) => {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            zIndex: isDragging ? 1000 : 1,
            position: 'relative' as const,
        };

        return (
            <Box
                ref={setNodeRef}
                style={style}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: isDragging ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                    backdropFilter: isDragging ? 'blur(10px)' : 'none',
                    transition: 'background-color 0.2s ease',
                }}
            >
                <Box
                    {...attributes}
                    {...listeners}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 1.5,
                        cursor: 'grab',
                        color: MUTED_TEXT,
                        opacity: 0.4,
                        '&:hover': { opacity: 1, color: ICON_COLOR },
                        '&:active': { cursor: 'grabbing' }
                    }}
                >
                    <DragIndicatorIcon fontSize="small" />
                </Box>
                <Box sx={{ flex: 1 }}>{children}</Box>
            </Box>
        );
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (!over || !path) return;
        const activeId = String(active.id);
        const overId = String(over.id);
        if (activeId === overId) return;
        let targetSectionId: string | null = null;
        let targetIndex = 0;
        const overSection = path.sections?.find(s => s.id === overId);
        if (overSection) {
            targetSectionId = overSection.id;
            targetIndex = overSection.courses.length || 0;
        } else {
            let foundIdx = -1;
            let foundSection: string | null = null;
            for (const s of path.sections || []) {
                const idx = s.courses.findIndex(c => c.id === overId);
                if (idx !== -1) { foundIdx = idx; foundSection = s.id; break; }
            }
            if (foundIdx !== -1) {
                targetSectionId = foundSection;
                targetIndex = foundIdx;
            } else {
                const idxU = path.courses.filter(c => !c.sectionId).findIndex(c => c.id === overId);
                if (idxU !== -1) {
                    targetSectionId = null;
                    targetIndex = idxU;
                }
            }
        }
        try {
            await fetch(`/api/learning-paths/${id}/courses/reorder`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
                body: JSON.stringify({ items: [{ id: activeId, sectionId: targetSectionId, order: targetIndex }] })
            });
            await fetchPath();
        } catch { }
    };

    // Fetch learning path
    const fetchPath = useCallback(async () => {
        try {
            const response = await fetch(`/api/learning-paths/${id}`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setPath(data);
                setRefreshKey(prev => prev + 1); // Force re-render
            }
        } catch (error) {
            console.error('Failed to fetch learning path:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Fetch available courses
    const fetchCourses = async () => {
        try {
            const data = await apiFetch<any>('/api/courses?limit=100');
            const courses = Array.isArray(data) ? data : (data.courses || data.data || []);
            setAvailableCourses(courses);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    };

    useEffect(() => {
        fetchPath();
        fetchCourses();
    }, [fetchPath]);

    useEffect(() => {
        console.log('[EditPage] deep link effect', {
            didApply: didApplyDeepLink.current,
            loading,
            hasPath: !!path,
            searchParams: searchParams.toString()
        });

        if (didApplyDeepLink.current) return;
        if (loading) return;

        console.log('[EditPage] applying deep link');

        const addCourse = searchParams.get('addCourse') === '1';
        const drawer = searchParams.get('drawer');

        if (addCourse) {
            console.log('[EditPage] opening course dialog via deep link');
            setShowCourseDialog(true);
        }

        if (path) {
            if (drawer === 'users') {
                setShowUsersDrawer(true);
            }
            if (drawer === 'settings') {
                setShowSettingsDrawer(true);
            }
        }

        didApplyDeepLink.current = true;
    }, [loading, path, searchParams]);

    // Auto-save function
    const saveField = useCallback(async (field: string, value: any) => {
        if (!id) return;

        setSaving(true);
        try {
            const response = await fetch(`/api/learning-paths/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ [field]: value }),
            });

            if (response.ok) {
                const updated = await response.json();
                setPath(updated);
                showToast('Saved', 'success');
            } else {
                showToast('Failed to save', 'error');
            }
        } catch (error) {
            console.error('Failed to save:', error);
            showToast('Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    }, [id, showToast]);

    // Handle name change
    const handleNameChange = (value: string) => {
        if (!path) return;
        setPath({ ...path, name: value });
    };

    const pathId = path?.id;
    const pathName = path?.name ?? '';
    const pathDescription = path?.description ?? '';

    useEffect(() => {
        if (!pathId) return;
        const timeout = setTimeout(() => {
            void saveField('name', pathName);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [pathId, pathName, saveField]);

    // Handle description change
    const handleDescriptionChange = (value: string) => {
        if (!path) return;
        if (value.length > 5000) return;
        setPath({ ...path, description: value });
    };

    useEffect(() => {
        if (!pathId) return;
        const timeout = setTimeout(() => {
            void saveField('description', pathDescription);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [pathDescription, pathId, saveField]);

    // Toggle status
    const toggleStatus = async () => {
        if (!path) return;
        const newIsActive = !path.isActive;
        await saveField('isActive', newIsActive);
    };

    // Add course callback
    const handleCourseAdded = async () => {
        // If there are no sections yet, create a default one
        if (!path?.sections || path.sections.length === 0) {
            try {
                await fetch(`/api/learning-paths/${id}/sections`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': getCsrfToken()
                    },
                    body: JSON.stringify({
                        name: 'Main Section',
                        order: 1
                    }),
                });
            } catch (error) {
                console.error('Failed to create default section:', error);
            }
        }

        await fetchPath();
        setShowCourseDialog(false);
        showToast('Course added', 'success');
    };

    // Get unlock tooltip text
    const getUnlockTooltip = (pc: LearningPathCourse): string => {
        if (pc.unlockType === 'NONE') return '';

        const depCourse = path?.courses.find(c => c.courseId === pc.unlockCourseId);
        if (!depCourse) return 'Locked';

        if (pc.unlockType === 'AFTER_COURSE') {
            return `Available after completing "${depCourse.course?.title || 'Course'}"`;
        } else if (pc.unlockType === 'AFTER_SCORE') {
            return `Available after passing "${depCourse.course?.title || 'Course'}" with ${pc.minScore}%`;
        }
        return 'Locked';
    };

    // Remove course
    const handleRemoveCourse = async (courseId: string) => {
        if (!courseId || courseId === 'undefined') {
            showToast('Error: Course ID is missing', 'error');
            return;
        }

        if (!confirm('Remove this course from the learning path?')) return;

        try {
            const response = await fetch(`/api/learning-paths/${id}/courses/${courseId}`, {
                method: 'DELETE',
                headers: { 'x-csrf-token': getCsrfToken() },
            });

            if (response.ok) {
                await fetchPath();
                showToast('Course removed', 'success');
            } else {
                showToast('Failed to remove course', 'error');
            }
        } catch (error) {
            console.error('Failed to remove course:', error);
            showToast('Failed to remove course', 'error');
        }
    };

    // Handle image upload
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be smaller than 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            await saveField('image', base64);
        };
        reader.readAsDataURL(file);
    };

    // Add section
    const handleAddSection = async () => {
        const newSectionNumber = (path?.sections?.length || 0) + 1;
        try {
            const response = await fetch(`/api/learning-paths/${id}/sections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({
                    name: `section ${newSectionNumber}`,
                    order: newSectionNumber
                }),
            });

            if (response.ok) {
                await fetchPath();
                showToast('Section added', 'success');
            }
        } catch (error) {
            console.error('Failed to add section:', error);
            showToast('Failed to add section', 'error');
        }
    };

    // Update section name
    const handleUpdateSectionName = async (sectionId: string, name: string) => {
        try {
            const response = await fetch(`/api/learning-paths/${id}/sections/${sectionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ name }),
            });

            if (response.ok) {
                await fetchPath();
                showToast('Section updated', 'success');
            }
        } catch (error) {
            console.error('Failed to update section:', error);
            showToast('Failed to update section', 'error');
        }
    };

    // Delete section
    const handleDeleteSection = async (sectionId: string) => {
        if (!confirm('Delete this section? Courses will be ungrouped.')) return;

        try {
            const response = await fetch(`/api/learning-paths/${id}/sections/${sectionId}`, {
                method: 'DELETE',
                headers: { 'x-csrf-token': getCsrfToken() },
            });

            if (response.ok) {
                await fetchPath();
                showToast('Section deleted', 'success');
            }
        } catch (error) {
            console.error('Failed to delete section:', error);
            showToast('Failed to delete section', 'error');
        }
    };

    const ICON_COLOR = 'hsl(var(--primary))';
    const DIVIDER = 'hsl(var(--border) / 0.1)';
    const TEXT_COLOR = 'hsl(var(--foreground))';
    const MUTED_TEXT = 'hsl(var(--muted-foreground))';

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
                <CircularProgress size={32} thickness={4} sx={{ color: ICON_COLOR }} />
            </Box>
        );
    }

    if (!path) {
        return (
            <Box sx={{ minHeight: '100vh', p: 4, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <IconButton
                        onClick={() => router.push(basePath)}
                        sx={{
                            color: ICON_COLOR,
                            border: `1px solid ${DIVIDER}`,
                            bgcolor: 'hsl(var(--card) / 0.5)',
                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.1)' }
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h4" sx={{ ml: 2, fontWeight: 800, color: TEXT_COLOR }}>New Learning Path</Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 4, color: MUTED_TEXT }}>
                    This learning path does not exist. Create it by adding a course.
                </Typography>
                <Box sx={{ textAlign: 'center' }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowCourseDialog(true)}
                        sx={{
                            bgcolor: ICON_COLOR,
                            color: 'hsl(var(--primary-foreground))',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '10px',
                            px: 4,
                            height: 48,
                            boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)',
                            '&:hover': {
                                bgcolor: 'hsl(var(--primary) / 0.9)',
                                boxShadow: '0 6px 20px rgba(26, 84, 85, 0.23)'
                            },
                        }}
                    >
                        Add course
                    </Button>
                </Box>
                <AddCourseModal
                    open={showCourseDialog}
                    onClose={() => setShowCourseDialog(false)}
                    pathId={id}
                    existingCourses={[]}
                    availableCourses={availableCourses}
                    sections={[]}
                    onCourseAdded={handleCourseAdded}
                />
            </Box>
        );
    }

    const courseCount = path.courses.length;
    const maxCourses = 25;

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Box sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
                animation: 'fadeIn 0.5s ease-out',
                pb: 8
            }}>
                {/* Header Section */}
                <GlassCard
                    sx={{
                        py: 6,
                        px: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: 240,
                        m: 3,
                        borderRadius: 4,
                        border: `1px solid ${DIVIDER}`,
                    }}
                >
                    {/* Left Side: Back button and Title */}
                    <Box sx={{ flex: 1, pr: 3 }}>
                        <IconButton
                            onClick={() => router.push(basePath)}
                            sx={{
                                color: ICON_COLOR,
                                mb: 3,
                                border: `1px solid ${DIVIDER}`,
                                bgcolor: 'hsl(var(--card) / 0.5)',
                                '&:hover': { bgcolor: 'hsl(var(--primary) / 0.1)' }
                            }}
                        >
                            <ArrowBackIcon />
                        </IconButton>

                        {/* Editable Title */}
                        <TextField
                            fullWidth
                            value={path.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            variant="standard"
                            InputProps={{
                                disableUnderline: true,
                                sx: {
                                    color: TEXT_COLOR,
                                    fontSize: '3.5rem',
                                    fontWeight: 800,
                                    letterSpacing: '-0.03em',
                                    bgcolor: 'transparent !important',
                                    '& input': {
                                        padding: 0,
                                    },
                                },
                            }}
                            sx={{ mb: 2 }}
                        />

                        {/* Status Badge */}
                        <Box
                            onClick={toggleStatus}
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1,
                                border: `1px solid ${path.isActive ? 'hsl(142 71% 45% / 0.3)' : DIVIDER}`,
                                color: path.isActive ? 'hsl(142 71% 45%)' : MUTED_TEXT,
                                px: 2,
                                py: 0.75,
                                borderRadius: '20px',
                                cursor: 'pointer',
                                bgcolor: path.isActive ? 'hsl(142 71% 45% / 0.1)' : 'hsl(var(--card) / 0.5)',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: path.isActive ? 'hsl(142 71% 45% / 0.2)' : 'hsl(var(--card) / 0.8)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: path.isActive ? 'hsl(142 71% 45%)' : MUTED_TEXT }} />
                            {path.isActive ? 'Active' : 'Draft'}
                        </Box>
                        {saving && (
                            <Typography variant="caption" sx={{ ml: 2, color: MUTED_TEXT, fontWeight: 600 }}>
                                Saving changes...
                            </Typography>
                        )}
                    </Box>

                    {/* Right Side: Image Upload & Stats */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                            <Box sx={{ display: 'flex', gap: 4 }}>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Courses</Typography>
                                    <Typography variant="h4" sx={{ color: TEXT_COLOR, fontWeight: 800 }}>{courseCount}<Typography component="span" sx={{ color: DIVIDER, mx: 0.5 }}>/</Typography>{maxCourses}</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Tooltip title="Settings">
                                    <IconButton
                                        onClick={() => setShowSettingsDrawer(true)}
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            bgcolor: 'hsl(var(--card) / 0.5)',
                                            border: `1px solid ${DIVIDER}`,
                                            color: ICON_COLOR,
                                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.1)', transform: 'rotate(45deg)' },
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <SettingsOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Manage Users">
                                    <IconButton
                                        onClick={() => setShowUsersDrawer(true)}
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            bgcolor: 'hsl(var(--card) / 0.5)',
                                            border: `1px solid ${DIVIDER}`,
                                            color: ICON_COLOR,
                                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.1)' }
                                        }}
                                    >
                                        <PersonOutlineIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>

                        {/* Image Upload */}
                        <Box
                            component="label"
                            htmlFor="image-upload"
                            sx={{
                                width: 240,
                                height: 160,
                                bgcolor: 'hsl(var(--card) / 0.5)',
                                borderRadius: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                border: `1px solid ${DIVIDER}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: ICON_COLOR,
                                    bgcolor: 'hsl(var(--primary) / 0.05)',
                                    transform: 'scale(1.02)'
                                },
                            }}
                        >
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={handleImageUpload}
                            />
                            {path.image ? (
                                <Image
                                    src={path.image}
                                    alt="Path"
                                    width={240}
                                    height={160}
                                    loader={({ src }) => src}
                                    unoptimized
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <Box sx={{ textAlign: 'center', p: 2 }}>
                                    <AddIcon sx={{ fontSize: 32, color: MUTED_TEXT, mb: 1 }} />
                                    <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 700, display: 'block' }}>
                                        UPLOAD IMAGE
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </GlassCard>

                {/* Main Content */}
                <Box sx={{ flex: 1, py: 4, px: 3 }}>
                    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
                        {/* Description Section */}
                        <GlassCard
                            sx={{
                                mb: 6,
                                p: 3,
                                borderRadius: 3,
                                border: `1px solid ${DIVIDER}`,
                                bgcolor: 'hsl(var(--card) / 0.3)',
                            }}
                        >
                            <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 700, mb: 1.5, display: 'block', letterSpacing: '0.05em' }}>
                                DESCRIPTION
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Add a learning path description up to 5000 characters..."
                                value={path.description || ''}
                                onChange={(e) => handleDescriptionChange(e.target.value)}
                                variant="standard"
                                inputProps={{ maxLength: 5000 }}
                                InputProps={{
                                    disableUnderline: true,
                                    sx: {
                                        fontSize: '1rem',
                                        lineHeight: 1.6,
                                        color: TEXT_COLOR,
                                        bgcolor: 'transparent !important',
                                        '& textarea': {
                                            padding: 0,
                                        },
                                    },
                                }}
                            />
                        </GlassCard>

                        {/* Sections and Courses */}
                        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h5" sx={{ color: TEXT_COLOR, fontWeight: 800, letterSpacing: '-0.02em' }}>
                                Curriculum Structure
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddSection}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        borderRadius: '12px',
                                        borderColor: DIVIDER,
                                        color: TEXT_COLOR,
                                        px: 3,
                                        height: 44,
                                        '&:hover': {
                                            borderColor: ICON_COLOR,
                                            bgcolor: 'hsl(var(--primary) / 0.1)',
                                        },
                                    }}
                                >
                                    New Section
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={async () => {
                                        if (!path?.sections || path.sections.length === 0) {
                                            try {
                                                const response = await fetch(`/api/learning-paths/${id}/sections`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'x-csrf-token': getCsrfToken()
                                                    },
                                                    body: JSON.stringify({
                                                        name: 'Main Section',
                                                        order: 1
                                                    }),
                                                });
                                                if (response.ok) {
                                                    await fetchPath();
                                                }
                                            } catch (error) {
                                                console.error('Failed to create default section:', error);
                                            }
                                        }
                                        setShowCourseDialog(true);
                                    }}
                                    disabled={courseCount >= maxCourses}
                                    sx={{
                                        bgcolor: ICON_COLOR,
                                        color: 'hsl(var(--primary-foreground))',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        borderRadius: '12px',
                                        px: 3,
                                        height: 44,
                                        boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)',
                                        '&:hover': {
                                            bgcolor: 'hsl(var(--primary) / 0.9)',
                                            boxShadow: '0 6px 20px rgba(26, 84, 85, 0.23)'
                                        },
                                    }}
                                >
                                    Add Course
                                </Button>
                            </Box>
                        </Box>

                        {(path.sections && path.sections.length > 0) || path.courses.length > 0 ? (
                            <Box key={refreshKey}>
                                {path.sections?.sort((a, b) => a.order - b.order).map((section) => (
                                    <Box key={section.id} sx={{ mb: 5 }}>
                                        {/* Section Header */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, px: 2 }}>
                                            <DragIndicatorIcon sx={{ color: MUTED_TEXT, opacity: 0.3 }} />
                                            {editingSection === section.id ? (
                                                <TextField
                                                    autoFocus
                                                    value={editingSectionName}
                                                    onChange={(e) => setEditingSectionName(e.target.value)}
                                                    onBlur={() => {
                                                        handleUpdateSectionName(section.id, editingSectionName);
                                                        setEditingSection(null);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleUpdateSectionName(section.id, editingSectionName);
                                                            setEditingSection(null);
                                                        }
                                                    }}
                                                    size="small"
                                                    variant="standard"
                                                    sx={{
                                                        flex: 1,
                                                        '& .MuiInput-root': {
                                                            color: TEXT_COLOR,
                                                            fontSize: '1.25rem',
                                                            fontWeight: 800,
                                                            bgcolor: 'transparent !important',
                                                            '&:before, &:after': { display: 'none' }
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <Typography
                                                    variant="h6"
                                                    onClick={() => {
                                                        setEditingSection(section.id);
                                                        setEditingSectionName(section.name);
                                                    }}
                                                    sx={{
                                                        flex: 1,
                                                        cursor: 'pointer',
                                                        color: TEXT_COLOR,
                                                        fontWeight: 800,
                                                        fontSize: '1.25rem',
                                                        letterSpacing: '-0.01em',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': { color: ICON_COLOR, transform: 'translateX(4px)' }
                                                    }}
                                                >
                                                    {section.name}
                                                </Typography>
                                            )}
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteSection(section.id)}
                                                sx={{
                                                    color: MUTED_TEXT,
                                                    opacity: 0.5,
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        color: 'hsl(var(--destructive))',
                                                        bgcolor: 'hsl(var(--destructive) / 0.1)',
                                                        opacity: 1
                                                    }
                                                }}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        {/* Courses in section */}
                                        <GlassCard p={0} activeEffect={false} sx={{ border: `1px solid ${DIVIDER}`, borderRadius: 3, overflow: 'hidden', bgcolor: 'hsl(var(--card) / 0.2)' }}>
                                            {section.courses.length > 0 ? (
                                                <SortableContext items={section.courses.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                                    <List sx={{ p: 0 }}>
                                                        {section.courses
                                                            .sort((a, b) => a.order - b.order)
                                                            .map((pc, index) => (
                                                                <SortableCourse key={pc.id} id={pc.id}>
                                                                    <ListItem
                                                                        sx={{
                                                                            py: 2,
                                                                            px: 2,
                                                                            borderBottom: index < section.courses.length - 1 ? `1px solid ${DIVIDER}` : 'none',
                                                                            transition: 'all 0.2s ease',
                                                                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.05)' }
                                                                        }}
                                                                        secondaryAction={
                                                                            <IconButton
                                                                                edge="end"
                                                                                onClick={() => handleRemoveCourse(pc.courseId)}
                                                                                sx={{
                                                                                    color: MUTED_TEXT,
                                                                                    opacity: 0.5,
                                                                                    '&:hover': { color: 'hsl(var(--destructive))', opacity: 1 }
                                                                                }}
                                                                            >
                                                                                <DeleteOutlineIcon fontSize="small" />
                                                                            </IconButton>
                                                                        }
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                                                            <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 800, minWidth: 24, fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem', opacity: 0.5 }}>
                                                                                {String(index + 1).padStart(2, '0')}
                                                                            </Typography>
                                                                        </Box>
                                                                        <ListItemText
                                                                            primary={
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                                    <Typography sx={{ color: TEXT_COLOR, fontWeight: 700, fontSize: '0.95rem' }}>
                                                                                        {pc.course?.title || 'Course'}
                                                                                    </Typography>
                                                                                    {pc.unlockType !== 'NONE' && (
                                                                                        <Tooltip title={getUnlockTooltip(pc)} arrow>
                                                                                            <LockIcon sx={{ fontSize: 14, color: ICON_COLOR, opacity: 0.6 }} />
                                                                                        </Tooltip>
                                                                                    )}
                                                                                </Box>
                                                                            }
                                                                            secondary={
                                                                                <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                                                                                    {pc.course?.code || 'NO CODE'}
                                                                                </Typography>
                                                                            }
                                                                        />
                                                                    </ListItem>
                                                                </SortableCourse>
                                                            ))}
                                                    </List>
                                                </SortableContext>
                                            ) : (
                                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                                    <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 600, fontSize: '0.85rem' }}>
                                                        Empty section
                                                    </Typography>
                                                </Box>
                                            )}
                                        </GlassCard>
                                    </Box>
                                ))}

                                {/* Ungrouped courses */}
                                {path.courses.filter(c => !c.sectionId).length > 0 && (
                                    <Box sx={{ mt: 4 }}>
                                        <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 800, mb: 2, display: 'block', px: 2, letterSpacing: '0.15em', fontSize: '0.7rem' }}>
                                            UNGROUPED COURSES
                                        </Typography>
                                        <GlassCard p={0} activeEffect={false} sx={{ border: `1px solid ${DIVIDER}`, borderRadius: 3, overflow: 'hidden', bgcolor: 'hsl(var(--card) / 0.2)' }}>
                                            <SortableContext items={path.courses.filter(c => !c.sectionId).map(c => c.id)} strategy={verticalListSortingStrategy}>
                                                <List sx={{ p: 0 }}>
                                                    {path.courses
                                                        .filter(c => !c.sectionId)
                                                        .sort((a, b) => a.order - b.order)
                                                        .map((pc, index, arr) => (
                                                            <SortableCourse key={pc.id} id={pc.id}>
                                                                <ListItem
                                                                    sx={{
                                                                        py: 2,
                                                                        px: 2,
                                                                        borderBottom: index < arr.length - 1 ? `1px solid ${DIVIDER}` : 'none',
                                                                        transition: 'all 0.2s ease',
                                                                        '&:hover': { bgcolor: 'hsl(var(--primary) / 0.05)' }
                                                                    }}
                                                                    secondaryAction={
                                                                        <IconButton
                                                                            edge="end"
                                                                            onClick={() => handleRemoveCourse(pc.courseId)}
                                                                            sx={{
                                                                                color: MUTED_TEXT,
                                                                                opacity: 0.5,
                                                                                '&:hover': { color: 'hsl(var(--destructive))', opacity: 1 }
                                                                            }}
                                                                        >
                                                                            <DeleteOutlineIcon fontSize="small" />
                                                                        </IconButton>
                                                                    }
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                                                        <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 800, minWidth: 24, fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem', opacity: 0.5 }}>
                                                                            {String(index + 1).padStart(2, '0')}
                                                                        </Typography>
                                                                    </Box>
                                                                    <ListItemText
                                                                        primary={
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                                <Typography sx={{ color: TEXT_COLOR, fontWeight: 700, fontSize: '0.95rem' }}>
                                                                                    {pc.course?.title || 'Course'}
                                                                                </Typography>
                                                                                {pc.unlockType !== 'NONE' && (
                                                                                    <Tooltip title={getUnlockTooltip(pc)} arrow>
                                                                                        <LockIcon sx={{ fontSize: 14, color: ICON_COLOR, opacity: 0.6 }} />
                                                                                    </Tooltip>
                                                                                )}
                                                                            </Box>
                                                                        }
                                                                        secondary={
                                                                            <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                                                                                {pc.course?.code || 'NO CODE'}
                                                                            </Typography>
                                                                        }
                                                                    />
                                                                </ListItem>
                                                            </SortableCourse>
                                                        ))}
                                                </List>
                                            </SortableContext>
                                        </GlassCard>
                                    </Box>
                                )}
                            </Box>
                        ) : (
                            <Box sx={{
                                py: 12,
                                textAlign: 'center',
                                bgcolor: 'hsl(var(--card) / 0.2)',
                                borderRadius: 6,
                                border: `2px dashed ${DIVIDER}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: ICON_COLOR,
                                    bgcolor: 'hsl(var(--primary) / 0.05)'
                                }
                            }}>
                                <Typography variant="h6" sx={{ color: TEXT_COLOR, mb: 1, fontWeight: 700 }}>
                                    Your learning path is empty
                                </Typography>
                                <Typography variant="body2" sx={{ color: MUTED_TEXT, mb: 4, fontWeight: 500 }}>
                                    Start building your curriculum by adding sections and courses.
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setShowCourseDialog(true)}
                                    sx={{
                                        bgcolor: ICON_COLOR,
                                        color: 'hsl(var(--primary-foreground))',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        borderRadius: '12px',
                                        px: 4,
                                        height: 48,
                                        boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)',
                                        '&:hover': {
                                            bgcolor: 'hsl(var(--primary) / 0.9)',
                                            boxShadow: '0 6px 20px rgba(26, 84, 85, 0.23)'
                                        },
                                    }}
                                >
                                    Add your first course
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Modals & Panels */}
                <AddCourseModal
                    open={showCourseDialog}
                    onClose={() => setShowCourseDialog(false)}
                    pathId={id}
                    existingCourses={path.courses}
                    availableCourses={availableCourses}
                    sections={path.sections}
                    onCourseAdded={handleCourseAdded}
                />

                <LearningPathOptionsPanel
                    open={showSettingsDrawer}
                    pathId={id}
                    onClose={() => setShowSettingsDrawer(false)}
                    onSaved={async () => {
                        await fetchPath();
                        showToast('Settings saved successfully', 'success');
                    }}
                />

                <UsersPanel
                    open={showUsersDrawer}
                    pathId={id}
                    onClose={() => setShowUsersDrawer(false)}
                />
            </Box>
        </DndContext>
    );
}

