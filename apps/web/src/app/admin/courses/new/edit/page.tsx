'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    List,
    ListItem,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
    Button,
    TextField,
    Tooltip,
    Paper,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    ListItemButton,
    ListItemIcon as MuiListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Drawer
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getCsrfToken } from '@/lib/client-csrf';
import { apiFetch } from '@shared/http/apiFetch';
import { GlassCard } from '@/shared/ui/components/GlassCard';

// Custom components
import Header from '@modules/courses/editor/Header';
import AddMenuGrouped from '@modules/courses/editor/AddMenu';
import CurriculumBuilder from '@modules/courses/editor/CurriculumBuilder';
import CloneLinkDialog from '@modules/courses/editor/CloneLinkDialog';
import GenericUnitModal from '@modules/courses/editor/GenericUnitModal';

// Unit Editors
import TextUnitEditor from '@modules/courses/unit-editors/TextUnitEditor';
import VideoUnitEditor from '@modules/courses/unit-editors/VideoUnitEditor';
import AudioUnitEditor from '@modules/courses/unit-editors/AudioUnitEditor';
import DocumentUnitEditor from '@modules/courses/unit-editors/DocumentUnitEditor';
import IframeUnitEditor from '@modules/courses/unit-editors/IframeUnitEditor';
import ILTUnitEditor from '@modules/courses/unit-editors/ILTUnitEditor';
import TestUnitEditor from '@modules/courses/unit-editors/TestUnitEditor';
import SurveyUnitEditor from '@modules/courses/unit-editors/SurveyUnitEditor';
import AssignmentUnitEditor from '@modules/courses/unit-editors/AssignmentUnitEditor';
import ScormUnitEditor from '@modules/courses/unit-editors/ScormUnitEditor';

// Existing Modals
import TextUnitModal from '@modules/courses/editor/TextUnitModal';
import FileUnitModal from '@modules/courses/editor/FileUnitModal';
import VideoUnitModal from '@modules/courses/editor/VideoUnitModal';
import EmbedUnitModal from '@modules/courses/editor/EmbedUnitModal';
import TestUnitModal from '@modules/courses/editor/TestUnitModal';
import SurveyUnitModal from '@modules/courses/editor/SurveyUnitModal';
import SectionUnitModal from '@modules/courses/editor/SectionUnitModal';

// Drawers
import CourseSettingsDrawer from '@modules/courses/editor/CourseSettingsDrawer';
import CourseEnrollmentDrawer from '@modules/courses/editor/CourseEnrollmentDrawer';

// New Components
import CourseOutlineSidebar from '@modules/courses/editor/CourseOutlineSidebar';
import CourseOptionsTab from '@modules/courses/editor/CourseOptionsTab';
import CourseUsersTab from '@modules/courses/editor/CourseUsersTab';
import UnitOptionsDrawer from '@modules/courses/editor/UnitOptionsDrawer';

function CourseEditorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');

    // Detect if we're in instructor or admin route
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isInstructorRoute = pathname.includes('/instructor/');
    const basePath = isInstructorRoute ? '/instructor/courses' : '/admin/courses';

    // State
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saved');
    const [currentTab, setCurrentTab] = useState(0);
    const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [cloneLinkMode, setCloneLinkMode] = useState<'clone' | 'link' | null>(null);

    // Files State
    const [files, setFiles] = useState<any[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // Modals
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

    // Drawers
    const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
    const [enrollmentDrawerOpen, setEnrollmentDrawerOpen] = useState(false);
    const [unitOptionsDrawerOpen, setUnitOptionsDrawerOpen] = useState(false);
    const [optionsUnitId, setOptionsUnitId] = useState<string | null>(null);
    const [moveUnitId, setMoveUnitId] = useState<string | null>(null);
    const [moveUnitDialogOpen, setMoveUnitDialogOpen] = useState(false);
    const [courseSettings, setCourseSettings] = useState<any>({});
    const [usersRefreshTrigger, setUsersRefreshTrigger] = useState(0);

    // Initial Fetch
    const fetchCourse = useCallback(async () => {
        if (!courseId) return;
        try {
            const res = await fetch(`/api/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data);
                setCourseSettings(typeof data.settings === 'string' ? JSON.parse(data.settings) : (data.settings || {}));
            }
        } catch (err) {
            console.error('Failed to fetch course', err);
        }
    }, [courseId]);

    const fetchFiles = useCallback(async () => {
        if (!courseId) return;
        setLoadingFiles(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/files`);
            if (res.ok) {
                const data = await res.json();
                setFiles(data);
            }
        } catch (err) {
            console.error('Failed to fetch files', err);
        } finally {
            setLoadingFiles(false);
        }
    }, [courseId]);

    useEffect(() => {
        const loadAllData = async () => {
            if (courseId) {
                setLoading(true);
                await fetchCourse();
                await fetchFiles();
                setLoading(false);
            } else {
                // No courseId - create a new course automatically
                setLoading(true);
                try {
                    const newCourse = await apiFetch<any>('/api/courses', {
                        method: 'POST',
                        body: {
                            title: 'Untitled Course',
                            status: 'DRAFT'
                        }
                    });
                    // Redirect to the same page with the new course ID
                    const currentPath = window.location.pathname;
                    router.replace(`${currentPath}?id=${newCourse.id}`);
                } catch (err) {
                    console.error('Failed to create new course:', err);
                    setSnackbar({ open: true, message: 'Failed to create course', severity: 'error' });
                    setLoading(false);
                }
            }
        };
        loadAllData();
    }, [courseId, fetchCourse, fetchFiles, router]);

    const handleReorder = async (sections: any[], units: any[]) => {
        if (!courseId) return;
        setSaveState('saving');
        try {
            await apiFetch(`/api/courses/${courseId}/reorder`, {
                method: 'PATCH',
                body: { sections, units }
            });
            await fetchCourse();
            setSaveState('saved');
        } catch (err) {
            setSaveState('error');
            setSnackbar({ open: true, message: 'Failed to save order', severity: 'error' });
        }
    };

    const handleAutoSave = useCallback(async (data: any) => {
        if (!courseId) return;
        setSaveState('saving');
        try {
            await apiFetch(`/api/courses/${courseId}`, {
                method: 'PUT',
                body: data
            });
            setSaveState('saved');
        } catch (err) {
            setSaveState('error');
        }
    }, [courseId]);

    const saveTimeout = useRef<any>(null);
    const onFieldChange = (field: string, value: any) => {
        setCourse((prev: any) => ({ ...prev, [field]: value }));
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => handleAutoSave({ [field]: value }), 1000);
    };

    // Unit Type Select
    const handleUnitTypeSelect = async (type: string) => {
        setAddMenuAnchor(null);
        const upperType = type.toUpperCase();
        if (['TEXT', 'CONTENT', 'VIDEO', 'AUDIO', 'DOCUMENT', 'IFRAME', 'ILT', 'TEST', 'SURVEY', 'ASSIGNMENT', 'SCORM'].includes(upperType)) {
            setSaveState('saving');
            // Convert CONTENT to TEXT since the API only accepts TEXT
            const apiType = upperType === 'CONTENT' ? 'TEXT' : upperType;
            try {
                const newUnit = await apiFetch<any>(`/api/courses/${courseId}/units`, {
                    method: 'POST',
                    body: {
                        type: apiType,
                        title: upperType === 'TEXT' || upperType === 'CONTENT' ? 'Content unit' :
                            upperType === 'IFRAME' ? 'Iframe unit' :
                                upperType === 'ILT' ? 'ILT unit' :
                                    upperType === 'SCORM' ? 'Scorm unit' : `New ${type.toLowerCase()} unit`,
                        config: { completion: { mode: 'button' } },
                        status: 'DRAFT'
                    },
                });
                setCourse((prev: any) => ({
                    ...prev,
                    unassignedUnits: [...(prev.unassignedUnits || []), newUnit]
                }));
                setEditingUnitId(newUnit.id);
                setSaveState('saved');
            } catch (err) {
                console.error('Failed to create unit:', err);
                setSaveState('error');
            }
        } else if (upperType === 'SECTION') {
            setSaveState('saving');
            try {
                const nextSectionNumber = (course?.sections?.length || 0) + 1;
                const newSection = await apiFetch<any>(`/api/courses/${courseId}/sections`, {
                    method: 'POST',
                    body: {
                        title: `Section ${nextSectionNumber}`,
                    },
                });

                setCourse((prev: any) => ({
                    ...prev,
                    sections: [...(prev.sections || []), { ...newSection, units: [] }]
                }));
                setSnackbar({ open: true, message: 'Section created successfully', severity: 'success' });
                setSaveState('saved');
            } catch (err) {
                console.error('Failed to create section:', err);
                setSaveState('error');
                setSnackbar({ open: true, message: 'Failed to create section', severity: 'error' });
            }
        } else {
            setActiveModal(type);
            setEditingUnitId(null);
        }
    };

    const handleImport = async (sourceUnitId: string, mode: 'clone' | 'link') => {
        if (!courseId) return;
        try {
            await apiFetch(`/api/courses/${courseId}/import-unit`, {
                method: 'POST',
                body: { sourceUnitId, mode }
            });
            await fetchCourse();
            setSnackbar({ open: true, message: `Unit ${mode === 'clone' ? 'cloned' : 'linked'} successfully`, severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to import unit', severity: 'error' });
        } finally {
            setCloneLinkMode(null);
        }
    };

    const handleEditUnit = (unitId: string) => {
        setEditingUnitId(unitId);
    };

    const handleConfigChange = async (unitId: string, newConfig: any) => {
        if (!courseId) return;
        setSaveState('saving');
        try {
            await apiFetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PUT',
                body: { config: newConfig }
            });
            // Update local course state with the new config
            setCourse((prev: any) => {
                const updateUnitInList = (list: any[]) =>
                    list.map(u => u.id === unitId ? { ...u, config: newConfig } : u);

                return {
                    ...prev,
                    sections: prev.sections?.map((s: any) => ({
                        ...s,
                        units: updateUnitInList(s.units || [])
                    })),
                    unassignedUnits: updateUnitInList(prev.unassignedUnits || [])
                };
            });
            setSaveState('saved');
        } catch (err) {
            setSaveState('error');
        }
    };

    const handleUnitTitleChange = async (unitId: string, newTitle: string) => {
        if (!courseId) return;
        setSaveState('saving');
        try {
            await apiFetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PUT',
                body: { title: newTitle }
            });
            setCourse((prev: any) => {
                const updateUnitInList = (list: any[]) =>
                    list.map(u => u.id === unitId ? { ...u, title: newTitle } : u);

                return {
                    ...prev,
                    sections: prev.sections?.map((s: any) => ({
                        ...s,
                        units: updateUnitInList(s.units || [])
                    })),
                    unassignedUnits: updateUnitInList(prev.unassignedUnits || [])
                };
            });
            setSaveState('saved');
        } catch (err) {
            setSaveState('error');
        }
    };

    const handlePublish = async () => {
        if (!courseId) return;
        setSaveState('saving');
        try {
            await apiFetch(`/api/courses/${courseId}`, {
                method: 'PATCH',
                body: { action: 'publish' }
            });
            await fetchCourse();
            setSnackbar({ open: true, message: 'Course published', severity: 'success' });
        } catch (err) {
            setSaveState('error');
        } finally {
            setSaveState('saved');
        }
    };

    const handleUnpublish = async () => {
        if (!courseId) return;
        setSaveState('saving');
        try {
            await apiFetch(`/api/courses/${courseId}`, {
                method: 'PUT',
                body: { status: 'DRAFT' }
            });
            await fetchCourse();
            setSnackbar({ open: true, message: 'Course unpublished', severity: 'success' });
        } catch (err) {
            setSaveState('error');
        } finally {
            setSaveState('saved');
        }
    };


    const handleDuplicate = async () => {
        if (!courseId) return;
        if (!confirm('Duplicate this course?')) return;
        setSaveState('saving');
        try {
            const cloned = await apiFetch<any>(`/api/courses/${courseId}`, {
                method: 'PATCH',
                body: { action: 'clone' }
            });
            router.push(`${isInstructorRoute ? '/instructor' : '/admin'}/courses/new/edit?id=${cloned.id}`);
            setSnackbar({ open: true, message: 'Course duplicated', severity: 'success' });
        } catch (err) {
            setSaveState('error');
        } finally {
            setSaveState('saved');
        }
    };

    const handleDelete = async () => {
        if (!courseId) return;
        if (!confirm('Are you sure you want to delete this course?')) return;
        try {
            await apiFetch(`/api/courses/${courseId}`, {
                method: 'DELETE'
            });
            router.push(basePath);
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to delete course', severity: 'error' });
        }
    };

    const handlePublishUnit = async (unitId: string) => {
        if (!courseId) return;
        try {
            await apiFetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PATCH',
                body: { action: 'publish' }
            });
            await fetchCourse();
        } catch (err) { }
    };

    const handleUnpublishUnit = async (unitId: string) => {
        if (!courseId) return;
        try {
            await apiFetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PATCH',
                body: { action: 'unpublish' }
            });
            await fetchCourse();
        } catch (err) { }
    };

    const handleDuplicateUnit = async (unitId: string) => {
        if (!courseId) return;
        try {
            await apiFetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PATCH',
                body: { action: 'duplicate' }
            });
            await fetchCourse();
        } catch (err) { }
    };

    const handleDeleteUnit = async (uId: string) => {
        if (!courseId || !confirm('Delete unit?')) return;
        try {
            await apiFetch(`/api/courses/${courseId}/units/${uId}`, {
                method: 'DELETE'
            });
            if (uId === editingUnitId) setEditingUnitId(null);
            await fetchCourse();
        } catch (err) { }
    };

    const handleMoveUnit = async (unitId: string, sectionId: string | null) => {
        if (!courseId) return;
        try {
            await apiFetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PATCH',
                body: { action: 'move', sectionId }
            });
            await fetchCourse();
            setMoveUnitDialogOpen(false);
        } catch (err) { }
    };

    const handleSaveUnitOptions = async (unitId: string, options: any) => {
        if (!courseId) return;
        try {
            await apiFetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PUT',
                body: { ...findUnitById(unitId), ...options }
            });
            await fetchCourse();
        } catch (err) { }
    };

    const findUnitById = (unitId: string): any => {
        if (!course) return null;
        for (const section of course.sections || []) {
            const unit = section.units.find((u: any) => u.id === unitId);
            if (unit) return unit;
        }
        for (const unit of course.unassignedUnits || []) {
            if (unit.id === unitId) return unit;
        }
        return null;
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !courseId) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            await apiFetch(`/api/courses/${courseId}/files`, {
                method: 'POST',
                body: formData
            });
            await fetchFiles();
        } catch (err) { }
    };

    const handleFileDownload = (fileUrl: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.click();
    };

    const handleFileDelete = async (fileId: string) => {
        if (!confirm('Delete file?')) return;
        try {
            await apiFetch(`/api/files/${fileId}`, {
                method: 'DELETE'
            });
            await fetchFiles();
        } catch (err) { }
    };

    const handleImageUpload = async (file: File) => {
        if (!courseId) return;
        setSaveState('saving');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const data = await apiFetch<any>(`/api/courses/${courseId}/image`, {
                method: 'POST',
                body: formData
            });

            setCourse((prev: any) => ({ ...prev, thumbnailUrl: data.imageUrl }));
            setSnackbar({ open: true, message: 'Course image uploaded successfully', severity: 'success' });
            setSaveState('saved');
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to upload image', severity: 'error' });
            setSaveState('error');
        }
    };

    const handleImageGenerate = async () => {
        if (!courseId) return;
        setSaveState('saving');

        try {
            const prompt = course.title ?
                `Educational course cover image for: ${course.title}` :
                'Generic educational course cover image';

            const data = await apiFetch<any>(`/api/courses/${courseId}/generate-image`, {
                method: 'POST',
                body: { prompt }
            });

            setCourse((prev: any) => ({ ...prev, thumbnailUrl: data.imageUrl }));
            setSnackbar({ open: true, message: 'Course image generated successfully', severity: 'success' });
            setSaveState('saved');
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to generate image', severity: 'error' });
            setSaveState('error');
        }
    };


    const ICON_COLOR = 'hsl(var(--primary))';
    const DIVIDER = 'hsl(var(--border) / 0.1)';
    const TEXT_COLOR = 'hsl(var(--foreground))';
    const MUTED_TEXT = 'hsl(var(--muted-foreground))';

    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <CircularProgress size={32} thickness={4} sx={{ color: ICON_COLOR }} />
            </Box>
        );
    }

    if (!course) return <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh' }}><Typography sx={{ color: TEXT_COLOR }}>Course not found</Typography></Box>;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'background.default', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Top Navigation Bar */}
            <Box sx={{
                height: 56,
                bgcolor: 'hsl(var(--card) / 0.5)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                px: 3,
                justifyContent: 'space-between',
                color: TEXT_COLOR,
                zIndex: 1200,
                borderBottom: `1px solid ${DIVIDER}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton size="small" sx={{ color: ICON_COLOR, '&:hover': { bgcolor: 'hsl(var(--primary) / 0.1)' } }}>
                        <MenuIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            if (editingUnitId) {
                                const u = findUnitById(editingUnitId);
                                if (u?.status === 'PUBLISHED') handleUnpublishUnit(editingUnitId);
                                else handlePublishUnit(editingUnitId);
                            } else {
                                if (course.status === 'DRAFT') handlePublish();
                                else handleUnpublish();
                            }
                        }}
                        sx={{
                            bgcolor: ICON_COLOR,
                            color: 'hsl(var(--primary-foreground))',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '8px',
                            px: 3,
                            height: 36,
                            fontSize: '0.875rem',
                            boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)',
                            '&:hover': {
                                bgcolor: 'hsl(var(--primary) / 0.9)',
                                boxShadow: '0 6px 20px rgba(26, 84, 85, 0.23)'
                            }
                        }}
                    >
                        {editingUnitId ? (
                            findUnitById(editingUnitId)?.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'
                        ) : (
                            course.status === 'DRAFT' ? 'Publish' : 'Unpublish'
                        )}
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {saveState === 'saving' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={12} sx={{ color: ICON_COLOR }} />
                            <Typography sx={{ fontSize: '0.75rem', color: MUTED_TEXT, fontWeight: 600 }}>
                                Saving...
                            </Typography>
                        </Box>
                    )}
                    {saveState === 'saved' && (
                        <Typography sx={{ fontSize: '0.75rem', color: 'hsl(142 71% 45%)', fontWeight: 600 }}>
                            Saved
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar Navigation - Full Height */}
                <Box sx={{
                    width: 300,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: `1px solid ${DIVIDER}`,
                    bgcolor: 'hsl(var(--card) / 0.3)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <Box sx={{ px: 3, pt: 3, pb: 0 }}>
                        <Button
                            startIcon={<ArrowBackIcon sx={{ fontSize: '1rem' }} />}
                            sx={{
                                textTransform: 'none',
                                color: ICON_COLOR,
                                p: 0,
                                minWidth: 0,
                                fontWeight: 700,
                                mb: 2,
                                fontSize: '0.85rem',
                                '&:hover': { bgcolor: 'transparent', color: 'hsl(var(--primary) / 0.8)' }
                            }}
                            onClick={() => {
                                if (editingUnitId) {
                                    setEditingUnitId(null);
                                } else {
                                    router.push(basePath);
                                }
                            }}
                        >
                            Back to Courses
                        </Button>
                    </Box>

                    <CourseOutlineSidebar
                        sections={course.sections || []}
                        unassignedUnits={course.unassignedUnits || []}
                        onAddClick={(e: any) => setAddMenuAnchor(e.currentTarget)}
                        onUnitClick={handleEditUnit}
                        onSectionClick={() => { }}
                        onPublishUnit={handlePublishUnit}
                        onUnpublishUnit={handleUnpublishUnit}
                        onDuplicateUnit={handleDuplicateUnit}
                        onDeleteUnit={handleDeleteUnit}
                        onOptionsUnit={(id: string) => { setOptionsUnitId(id); setUnitOptionsDrawerOpen(true); }}
                        onMoveUnit={(id: string) => { setMoveUnitId(id); setMoveUnitDialogOpen(true); }}
                        courseTitle={course.title}
                        onOpenSettings={() => setSettingsDrawerOpen(true)}
                        onOpenUsers={() => setEnrollmentDrawerOpen(true)}
                        activeUnitId={editingUnitId}
                    />
                    <AddMenuGrouped
                        anchorEl={addMenuAnchor}
                        open={Boolean(addMenuAnchor)}
                        onClose={() => setAddMenuAnchor(null)}
                        onSelectType={handleUnitTypeSelect}
                    />
                </Box>

                {/* Main Content Area */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'transparent' }}>
                    {!editingUnitId ? (
                        <>
                            <Header
                                courseId={courseId!}
                                title={course.title}
                                description={course.description}
                                courseImage={course.thumbnailUrl}
                                status={course.status}
                                onTitleChange={(title) => onFieldChange('title', title)}
                                onDescriptionChange={(desc) => onFieldChange('description', desc)}
                                onImageUpload={handleImageUpload}
                                onImageGenerate={handleImageGenerate}
                                saveState={saveState}
                                onPublish={handlePublish}
                                onUnpublish={handleUnpublish}
                                onDuplicate={handleDuplicate}
                                onDelete={handleDelete}
                                isPublishing={saveState === 'saving'}
                                publishDisabled={false}
                                hidePublishButton={true}
                            />

                            <Box sx={{ flex: 1, overflowY: 'auto', px: 4, pt: 2, pb: 4 }}>
                                <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                                    <GlassCard p={0} activeEffect={false} sx={{ border: `1px solid ${DIVIDER}` }}>
                                        {/* Internal Tabs Header */}
                                        <Box sx={{ borderBottom: `1px solid ${DIVIDER}`, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
                                            <Tabs
                                                value={currentTab}
                                                onChange={(e, v) => setCurrentTab(v)}
                                                sx={{
                                                    minHeight: 56,
                                                    '& .MuiTab-root': {
                                                        textTransform: 'none',
                                                        fontWeight: 700,
                                                        fontSize: '0.875rem',
                                                        minWidth: 100,
                                                        height: 56,
                                                        color: MUTED_TEXT,
                                                        '&.Mui-selected': { color: ICON_COLOR }
                                                    },
                                                    '& .MuiTabs-indicator': { bgcolor: ICON_COLOR, height: 3 }
                                                }}
                                            >
                                                <Tab label="Content" />
                                                <Tab label="Files" />
                                                <Tab label="Course options" sx={{ display: 'none' }} />
                                                <Tab label="Users" sx={{ display: 'none' }} />
                                            </Tabs>
                                            <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 700, mr: 2, letterSpacing: '0.02em' }}>
                                                ALL UNITS MUST BE COMPLETED
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            {currentTab === 0 && (
                                                <CurriculumBuilder
                                                    sections={course.sections || []}
                                                    unassignedUnits={course.unassignedUnits || []}
                                                    onReorder={handleReorder}
                                                    onEditSection={() => { }}
                                                    onDeleteSection={() => { }}
                                                    onEditUnit={handleEditUnit}
                                                    onDeleteUnit={handleDeleteUnit}
                                                    onPublishUnit={handlePublishUnit}
                                                    onUnpublishUnit={handleUnpublishUnit}
                                                    onDuplicateUnit={handleDuplicateUnit}
                                                    onOptionsUnit={(id) => { setOptionsUnitId(id); setUnitOptionsDrawerOpen(true); }}
                                                    onMoveUnit={(id) => { setMoveUnitId(id); setMoveUnitDialogOpen(true); }}
                                                />
                                            )}
                                            {currentTab === 1 && (
                                                <Box sx={{ p: 4 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 800, color: TEXT_COLOR }}>Course Files</Typography>
                                                        <Button
                                                            variant="contained"
                                                            component="label"
                                                            startIcon={<CloudUploadIcon />}
                                                            sx={{
                                                                textTransform: 'none',
                                                                fontWeight: 700,
                                                                bgcolor: ICON_COLOR,
                                                                color: 'hsl(var(--primary-foreground))',
                                                                borderRadius: '8px',
                                                                px: 3,
                                                                '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                                                            }}
                                                        >
                                                            Upload File
                                                            <input type="file" hidden onChange={handleFileUpload} />
                                                        </Button>
                                                    </Box>
                                                    <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                        {files.map((file) => (
                                                            <ListItem
                                                                key={file.id}
                                                                sx={{
                                                                    border: `1px solid ${DIVIDER}`,
                                                                    borderRadius: 2,
                                                                    bgcolor: 'hsl(var(--card) / 0.3)',
                                                                    '&:hover': { bgcolor: 'hsl(var(--card) / 0.5)' }
                                                                }}
                                                                secondaryAction={
                                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                                        <Tooltip title="Download">
                                                                            <IconButton size="small" onClick={() => handleFileDownload(file.url, file.name)} sx={{ color: MUTED_TEXT, '&:hover': { color: ICON_COLOR } }}><DownloadIcon fontSize="small" /></IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Delete">
                                                                            <IconButton size="small" onClick={() => handleFileDelete(file.id)} sx={{ color: MUTED_TEXT, '&:hover': { color: 'hsl(var(--destructive))' } }}><DeleteIcon fontSize="small" /></IconButton>
                                                                        </Tooltip>
                                                                    </Box>
                                                                }
                                                            >
                                                                <MuiListItemIcon sx={{ color: ICON_COLOR }}>
                                                                    {file.type.startsWith('image/') ? <ImageIcon /> :
                                                                        file.type.includes('pdf') ? <PictureAsPdfIcon /> :
                                                                            file.type.startsWith('video/') ? <MovieIcon /> :
                                                                                <DescriptionIcon />}
                                                                </MuiListItemIcon>
                                                                <ListItemText
                                                                    primary={file.name}
                                                                    primaryTypographyProps={{ sx: { fontWeight: 600, color: TEXT_COLOR } }}
                                                                    secondary={`${(file.size / 1024).toFixed(1)} KB`}
                                                                    secondaryTypographyProps={{ variant: 'caption', sx: { color: MUTED_TEXT } }}
                                                                />
                                                            </ListItem>
                                                        ))}
                                                        {files.length === 0 && (
                                                            <Box sx={{ py: 8, textAlign: 'center' }}>
                                                                <DescriptionIcon sx={{ fontSize: 48, color: DIVIDER, mb: 2 }} />
                                                                <Typography sx={{ color: MUTED_TEXT, fontWeight: 500 }}>No files uploaded yet</Typography>
                                                            </Box>
                                                        )}
                                                    </List>
                                                </Box>
                                            )}
                                            {currentTab === 2 && (
                                                <Box sx={{ p: 4 }}>
                                                    <CourseOptionsTab course={course} onUpdate={(data) => handleAutoSave(data)} />
                                                </Box>
                                            )}

                                        </Box>
                                    </GlassCard>
                                </Box>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ flex: 1, overflowY: 'auto', p: 4, pt: 2 }}>
                            <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
                                <GlassCard sx={{ border: `1px solid ${DIVIDER}`, minHeight: '80vh' }}>
                                    {(() => {
                                        const unit = findUnitById(editingUnitId);
                                        if (!unit) return null;
                                        const editorProps = {
                                            unitId: unit.id,
                                            courseId: unit.courseId,
                                            config: unit.config || {},
                                            onConfigChange: (newConfig: any) => handleConfigChange(unit.id, newConfig),
                                            onTitleChange: (newTitle: string) => handleUnitTitleChange(unit.id, newTitle),
                                            title: unit.title,
                                        };

                                        switch (unit.type.toLowerCase()) {
                                            case 'text':
                                            case 'content':
                                                return <TextUnitEditor key={unit.id} {...editorProps} />;
                                            case 'video':
                                                return <VideoUnitEditor key={unit.id} {...editorProps} />;
                                            case 'audio':
                                                return <AudioUnitEditor key={unit.id} {...editorProps} />;
                                            case 'document':
                                                return <DocumentUnitEditor key={unit.id} {...editorProps} />;
                                            case 'iframe':
                                                return <IframeUnitEditor key={unit.id} {...editorProps} />;
                                            case 'ilt':
                                                return <ILTUnitEditor key={unit.id} {...editorProps} />;
                                            case 'test':
                                                return <TestUnitEditor key={unit.id} {...editorProps} />;
                                            case 'survey':
                                                return <SurveyUnitEditor key={unit.id} {...editorProps} />;
                                            case 'assignment':
                                                return <AssignmentUnitEditor key={unit.id} {...editorProps} />;
                                            case 'scorm':
                                                return <ScormUnitEditor key={unit.id} {...editorProps} />;
                                            default:
                                                return <Typography sx={{ color: TEXT_COLOR }}>Unknown unit type: {unit.type}</Typography>;
                                        }
                                    })()}
                                </GlassCard>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Modals and Drawers */}
            <AddMenuGrouped
                anchorEl={addMenuAnchor}
                open={!!addMenuAnchor}
                onClose={() => setAddMenuAnchor(null)}
                onSelectType={handleUnitTypeSelect}
            />

            <GenericUnitModal
                open={!!activeModal}
                type={activeModal || ''}
                onClose={() => setActiveModal(null)}
                courseId={courseId!}
                onSave={fetchCourse}
            />

            <Dialog open={moveUnitDialogOpen} onClose={() => setMoveUnitDialogOpen(false)}>
                <DialogTitle>Move Unit</DialogTitle>
                <DialogContent>
                    <List>
                        <ListItemButton onClick={() => moveUnitId && handleMoveUnit(moveUnitId, null)}>
                            <ListItemText primary="Unassigned" />
                        </ListItemButton>
                        {course.sections?.map((s: any) => (
                            <ListItemButton key={s.id} onClick={() => moveUnitId && handleMoveUnit(moveUnitId, s.id)}>
                                <ListItemText primary={s.title} />
                            </ListItemButton>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>

            <UnitOptionsDrawer
                open={unitOptionsDrawerOpen}
                onClose={() => setUnitOptionsDrawerOpen(false)}
                unit={optionsUnitId ? findUnitById(optionsUnitId) : null}
                onSave={(options) => optionsUnitId && handleSaveUnitOptions(optionsUnitId, options)}
            />

            <CourseSettingsDrawer
                open={settingsDrawerOpen}
                onClose={() => setSettingsDrawerOpen(false)}
                courseId={courseId!}
                settings={courseSettings}
                onSave={(settings) => {
                    setCourseSettings(settings);
                    handleAutoSave({ settings: JSON.stringify(settings) });
                }}
            />

            <CourseEnrollmentDrawer
                open={enrollmentDrawerOpen}
                onClose={() => setEnrollmentDrawerOpen(false)}
                courseId={courseId!}
            />

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<CircularProgress />}>
            <CourseEditorContent />
        </Suspense>
    );
}
