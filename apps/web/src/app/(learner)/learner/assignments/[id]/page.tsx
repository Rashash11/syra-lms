'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Button, TextField, CircularProgress,
    Alert, Chip, Stack, Divider, useTheme
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiFetch, ApiFetchError } from '@shared/http/apiFetch';
import { useThemeMode } from '@/shared/theme/ThemeContext';

interface Assignment {
    id: string;
    title: string;
    description: string | null;
    dueAt: string | null;
    allowText: boolean;
    allowFile: boolean;
    maxFiles: number;
    maxSizeMb: number;
    attachments?: any[];
    course?: {
        title: string;
    };
    submission?: {
        id: string;
        content: string | null;
        attachments: any;
        status: string;
        score: number | null;
        comment: string | null;
        learnerComment: string | null;
        submittedAt: string;
    } | null;
}

export default function LearnerAssignmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params?.id as string;
    const { mode } = useThemeMode();
    const theme = useTheme();

    const TEXT_COLOR = mode === 'liquid-glass' ? '#fff' : 'text.primary';
    const ICON_COLOR = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'divider';

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Submission form
    const [textResponse, setTextResponse] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [learnerComment, setLearnerComment] = useState('');
    const [savingComment, setSavingComment] = useState(false);

    const fetchAssignment = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/assignments/${assignmentId}`);
            if (res.ok) {
                const data = await res.json();
                setAssignment(data);
                if (data.submission) {
                    setLearnerComment(data.submission.learnerComment || '');
                }
            } else {
                setError('Failed to load assignment');
            }
        } catch (err) {
            setError('Error loading assignment');
        } finally {
            setLoading(false);
        }
    }, [assignmentId]);

    useEffect(() => {
        if (assignmentId) {
            void fetchAssignment();
        }
    }, [assignmentId, fetchAssignment]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);

            // Check total file count (existing + new)
            const totalFiles = files.length + selectedFiles.length;
            if (assignment && totalFiles > assignment.maxFiles) {
                setError(`You can only upload up to ${assignment.maxFiles} files total. Currently ${files.length} uploaded.`);
                e.target.value = ''; // Reset input
                return;
            }

            // Check file sizes
            if (assignment) {
                const maxSizeBytes = assignment.maxSizeMb * 1024 * 1024;
                const oversized = selectedFiles.find(f => f.size > maxSizeBytes);
                if (oversized) {
                    setError(`File "${oversized.name}" exceeds the ${assignment.maxSizeMb}MB limit`);
                    e.target.value = ''; // Reset input
                    return;
                }
            }

            // Add new files to existing files
            setFiles([...files, ...selectedFiles]);
            setError('');
            e.target.value = ''; // Reset input so same file can be selected again if needed
        }
    };

    const handleSubmit = async () => {
        if (!assignment) return;

        // Validation
        if (!assignment.allowText && files.length === 0) {
            setError('Please upload at least one file');
            return;
        }
        if (!assignment.allowFile && !textResponse.trim()) {
            setError('Please enter a text response');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // Upload files first if any
            const uploadedFiles: { url: string, name: string }[] = [];
            if (files.length > 0) {
                for (const file of files) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('context', 'assignment'); // Use 'assignment' context for disk storage
                    formData.append('contextId', assignmentId);

                    const uploadData = await apiFetch<{ file: { url: string; name?: string } }>('/api/upload', {
                        method: 'POST',
                        body: formData,
                    });

                    const fileInfo = uploadData.file;
                    uploadedFiles.push({
                        url: fileInfo.url,
                        name: fileInfo.name || file.name
                    });
                }
            }

            // Create/Update submission
            const submissionPayload = {
                content: textResponse || null,
                attachments: uploadedFiles,
            };

            await apiFetch(`/api/assignments/${assignmentId}/submissions`, {
                method: 'POST',
                body: submissionPayload,
            });
            setSuccess('Assignment submitted successfully!');
            setTimeout(() => router.push('/learner/assignments'), 2000);
        } catch (err) {
            setError(err instanceof ApiFetchError ? err.message : 'Error submitting assignment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveComment = async () => {
        if (!assignment?.submission) return;

        setSavingComment(true);
        setError('');
        try {
            await apiFetch('/api/submissions', {
                method: 'PUT',
                body: {
                    id: assignment.submission.id,
                    learnerComment
                },
            });

            setSuccess('Comment saved successfully!');
            setAssignment({
                ...assignment,
                submission: {
                    ...assignment.submission,
                    learnerComment
                }
            });
        } catch (err) {
            setError(err instanceof ApiFetchError ? err.message : 'Error saving comment');
        } finally {
            setSavingComment(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!assignment) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Assignment not found</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 900, mx: 'auto', color: TEXT_COLOR }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.back()}
                sx={{ 
                    mb: 3,
                    color: TEXT_COLOR,
                    '&:hover': {
                        bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : undefined
                    }
                }}
            >
                Back to Assignments
            </Button>

            <Paper sx={{ 
                p: 4,
                ...(mode === 'liquid-glass' ? {
                    backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
                    borderRadius: '24px',
                    color: '#fff'
                } : {
                    borderRadius: '12px',
                })
            }}>
                <Typography variant="h4" fontWeight={600} gutterBottom sx={{ color: 'inherit' }}>
                    {assignment.title}
                </Typography>

                {assignment.course && (
                    <Chip 
                        label={assignment.course.title} 
                        size="small" 
                        sx={{ 
                            mb: 2,
                            ...(mode === 'liquid-glass' && {
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.3)'
                            })
                        }} 
                    />
                )}

                {assignment.dueAt && (
                    <Typography variant="body2" sx={{ mb: 1, color: ICON_COLOR }} gutterBottom>
                        Due: {new Date(assignment.dueAt).toLocaleString()}
                    </Typography>
                )}

                <Divider sx={{ my: 3, borderColor: DIVIDER }} />

                {assignment.description && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'inherit' }}>Instructions</Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'inherit' }}>
                            {assignment.description}
                        </Typography>
                    </Box>
                )}

                {assignment.attachments && assignment.attachments.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'inherit' }}>Assignment Files</Typography>
                        <Typography variant="body2" sx={{ mb: 1, color: ICON_COLOR }} gutterBottom>
                            Download the files below to complete your assignment:
                        </Typography>
                        <Stack spacing={1} sx={{ mt: 2 }}>
                            {assignment.attachments.map((file: any, idx: number) => (
                                <Button
                                    key={idx}
                                    variant="outlined"
                                    startIcon={<UploadFileIcon />}
                                    href={file.url || file}
                                    target="_blank"
                                    download
                                    sx={{ 
                                        justifyContent: 'flex-start',
                                        color: TEXT_COLOR,
                                        borderColor: DIVIDER,
                                        '&:hover': {
                                            borderColor: TEXT_COLOR,
                                            bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : undefined
                                        }
                                    }}
                                >
                                    {file.name || file.url || `Attachment ${idx + 1}`}
                                </Button>
                            ))}
                        </Stack>
                    </Box>
                )}

                <Divider sx={{ my: 3, borderColor: DIVIDER }} />

                {assignment.submission ? (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'inherit' }}>
                            <CheckCircleIcon color="success" />
                            Submission Details
                            <Chip
                                label={assignment.submission.status}
                                size="small"
                                color={assignment.submission.status === 'GRADED' ? 'success' : 'primary'}
                                sx={{ 
                                    fontWeight: 700,
                                    ...(mode === 'liquid-glass' && assignment.submission.status !== 'GRADED' && {
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: '#fff'
                                    })
                                }}
                            />
                        </Typography>

                        <Paper variant="outlined" sx={{ 
                            p: 4, 
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.05)' : 'rgba(var(--primary-rgb), 0.02)', 
                            borderRadius: 3, 
                            border: mode === 'liquid-glass' ? `1px solid ${DIVIDER}` : '1px solid rgba(var(--primary-rgb), 0.1)',
                            color: 'inherit'
                        }}>
                            <Stack spacing={4}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1, color: ICON_COLOR }}>Submitted At</Typography>
                                        <Typography variant="body1" fontWeight={500}>{new Date(assignment.submission.submittedAt).toLocaleString()}</Typography>
                                    </Box>

                                    {assignment.submission.status === 'GRADED' && (
                                        <Box sx={{
                                            textAlign: 'center',
                                            p: 2,
                                            bgcolor: 'success.main',
                                            color: 'white',
                                            borderRadius: 2,
                                            minWidth: 120,
                                            boxShadow: '0 8px 16px rgba(46, 125, 50, 0.2)'
                                        }}>
                                            <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, opacity: 0.9 }}>Final Grade</Typography>
                                            <Typography variant="h3" fontWeight={900}>{assignment.submission.score}</Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>out of 100</Typography>
                                        </Box>
                                    )}
                                </Box>

                                {assignment.submission.status === 'GRADED' && assignment.submission.comment && (
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700} color={mode === 'liquid-glass' ? 'inherit' : 'primary'} gutterBottom>Instructor Feedback</Typography>
                                        <Paper sx={{
                                            p: 3,
                                            bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : 'background.paper',
                                            borderLeft: '5px solid',
                                            borderLeftColor: 'primary.main',
                                            borderRadius: 1,
                                            boxShadow: mode === 'liquid-glass' ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                                            color: 'inherit'
                                        }}>
                                            <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'inherit', lineHeight: 1.6 }}>
                                                "{assignment.submission.comment}"
                                            </Typography>
                                        </Paper>
                                    </Box>
                                )}

                                <Divider sx={{ borderColor: DIVIDER }} />

                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ color: 'inherit' }}>Your Conversation with Instructor</Typography>
                                    <Typography variant="body2" sx={{ mb: 2, color: ICON_COLOR }}>
                                        You can leave a comment or ask a question about your grade here.
                                    </Typography>
                                    <TextField
                                        multiline
                                        rows={4}
                                        fullWidth
                                        variant="outlined"
                                        placeholder="Type your message to the instructor..."
                                        value={learnerComment}
                                        onChange={(e) => setLearnerComment(e.target.value)}
                                        sx={{
                                            bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.05)' : 'background.paper',
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                color: TEXT_COLOR,
                                                '& fieldset': { borderColor: DIVIDER },
                                                '&:hover fieldset': { borderColor: TEXT_COLOR },
                                                '&.Mui-focused fieldset': { borderColor: TEXT_COLOR },
                                            }
                                        }}
                                    />
                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleSaveComment}
                                            disabled={savingComment || learnerComment === (assignment.submission.learnerComment || '')}
                                            startIcon={savingComment ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                                            sx={{ 
                                                borderRadius: 2, 
                                                px: 4,
                                                ...(mode === 'liquid-glass' && {
                                                    bgcolor: 'rgba(255,255,255,0.2)',
                                                    color: '#fff',
                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                                                    '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
                                                })
                                            }}
                                        >
                                            {savingComment ? 'Saving...' : 'Send Comment'}
                                        </Button>
                                    </Box>

                                    {success && <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>{success}</Alert>}
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>
                ) : (
                    <>
                        <Typography variant="h6" gutterBottom fontWeight={700} sx={{ color: 'inherit' }}>Submit Your Work</Typography>

                        <Stack spacing={3}>
                            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                            {success && <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>}

                            {assignment.allowText && (
                                <TextField
                                    label="Your Response"
                                    multiline
                                    rows={6}
                                    fullWidth
                                    value={textResponse}
                                    onChange={(e) => setTextResponse(e.target.value)}
                                    placeholder="Enter your answer here..."
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': { 
                                            borderRadius: 2,
                                            color: TEXT_COLOR,
                                            '& fieldset': { borderColor: DIVIDER },
                                            '&:hover fieldset': { borderColor: TEXT_COLOR },
                                            '&.Mui-focused fieldset': { borderColor: TEXT_COLOR },
                                        },
                                        '& .MuiInputLabel-root': { color: ICON_COLOR },
                                        '& .MuiInputLabel-root.Mui-focused': { color: TEXT_COLOR },
                                    }}
                                />
                            )}

                            {assignment.allowFile && (
                                <Box>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<UploadFileIcon />}
                                        fullWidth
                                        disabled={files.length >= assignment.maxFiles}
                                        sx={{ 
                                            py: 2, 
                                            borderRadius: 2, 
                                            borderStyle: 'dashed', 
                                            borderWidth: 2,
                                            color: TEXT_COLOR,
                                            borderColor: DIVIDER,
                                            '&:hover': {
                                                borderColor: TEXT_COLOR,
                                                bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : undefined
                                            }
                                        }}
                                    >
                                        {files.length >= assignment.maxFiles
                                            ? `Maximum ${assignment.maxFiles} files reached`
                                            : `Add Files (${files.length}/${assignment.maxFiles}) - ${assignment.maxSizeMb}MB each`
                                        }
                                        <input
                                            type="file"
                                            hidden
                                            multiple
                                            onChange={handleFileChange}
                                            disabled={files.length >= assignment.maxFiles}
                                        />
                                    </Button>
                                    {files.length > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: ICON_COLOR }}>
                                                Selected files ({files.length}/{assignment.maxFiles}):
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                {files.map((file, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        label={`${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`}
                                                        onDelete={() => setFiles(files.filter((_, i) => i !== idx))}
                                                        sx={{ 
                                                            mr: 1, 
                                                            mb: 1, 
                                                            borderRadius: 1,
                                                            ...(mode === 'liquid-glass' && {
                                                                bgcolor: 'rgba(255,255,255,0.2)',
                                                                color: '#fff',
                                                                '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' }
                                                            })
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            )}

                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleSubmit}
                                disabled={submitting || (!textResponse.trim() && files.length === 0)}
                                startIcon={submitting ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                                sx={{ 
                                    py: 1.5, 
                                    borderRadius: 2, 
                                    fontWeight: 700,
                                    ...(mode === 'liquid-glass' && {
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: '#fff',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                                        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
                                    })
                                }}
                            >
                                {submitting ? 'Submitting...' : 'Submit Assignment'}
                            </Button>
                        </Stack>
                    </>
                )}
            </Paper>
        </Box>
    );
}
