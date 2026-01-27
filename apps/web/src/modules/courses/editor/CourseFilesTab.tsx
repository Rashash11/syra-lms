'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    LinearProgress,
    Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import { getCsrfToken } from '@/lib/client-csrf';

const BORDER_COLOR_TRANSPARENT = 'hsl(var(--border) / 0.2)';
const CARD_BG_TRANSPARENT_LIGHT = 'hsl(var(--card) / 0.05)';
const CARD_BG_TRANSPARENT_LIGHT_HOVER = 'hsl(var(--card) / 0.08)';
const PRIMARY_COLOR = 'hsl(var(--primary))';
const PRIMARY_HOVER_BG = 'hsl(var(--primary) / 0.9)';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DISABLED_TEXT = 'hsl(var(--muted-foreground))';
const INFO_COLOR_MAIN = 'hsl(var(--info))';
const ERROR_COLOR_MAIN = 'hsl(var(--destructive))';
const SUCCESS_COLOR_MAIN = 'hsl(var(--success))';
const SECONDARY_TEXT = 'hsl(var(--secondary-foreground))';
const BORDER_COLOR_TRANSPARENT_LIGHT = 'hsl(var(--border) / 0.1)';

interface CourseFile {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: string;
}

interface CourseFilesTabProps {
    courseId: string;
}

export default function CourseFilesTab({ courseId }: CourseFilesTabProps) {
    const [files, setFiles] = useState<CourseFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/files`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setFiles(data.files || []);
        } catch (err) {
            console.error('Failed to fetch files');
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        void fetchFiles();
    }, [fetchFiles]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = event.target.files;
        if (!uploadedFiles || uploadedFiles.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        Array.from(uploadedFiles).forEach((file) => {
            formData.append('files', file);
        });

        try {
            // Simulate upload progress
            const uploadInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(uploadInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 100);

            const res = await fetch(`/api/courses/${courseId}/files`, {
                method: 'POST',
                body: formData,
            });

            clearInterval(uploadInterval);

            if (!res.ok) throw new Error();

            setUploadProgress(100);
            await fetchFiles();
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!confirm('Delete this file?')) return;

        try {
            const res = await fetch(`/api/files/${fileId}`, {
                method: 'DELETE',
                headers: { 'x-csrf-token': getCsrfToken() },
            });
            if (!res.ok) throw new Error();
            await fetchFiles();
        } catch (err) {
            console.error('Delete failed');
        }
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon sx={{ color: INFO_COLOR_MAIN }} />;
        if (type.includes('pdf')) return <PictureAsPdfIcon sx={{ color: ERROR_COLOR_MAIN }} />;
        if (type.startsWith('video/')) return <VideoFileIcon sx={{ color: SUCCESS_COLOR_MAIN }} />;
        return <InsertDriveFileIcon sx={{ color: MUTED_TEXT }} />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Box sx={{ p: 0 }}>
            {/* Upload Section */}
            <Box sx={{
                p: 8,
                border: `2px dashed ${BORDER_COLOR_TRANSPARENT}`,
                borderRadius: 3,
                textAlign: 'center',
                bgcolor: CARD_BG_TRANSPARENT_LIGHT,
                mb: 4,
                position: 'relative',
                '&:hover': {
                    borderColor: PRIMARY_COLOR,
                    bgcolor: CARD_BG_TRANSPARENT_LIGHT_HOVER
                }
            }}>
                <input
                    id="file-upload"
                    multiple
                    type="file"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                />
                <CloudUploadIcon sx={{ fontSize: 64, color: DISABLED_TEXT, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: TEXT_COLOR }}>
                    Upload Course Resources
                </Typography>
                <Typography variant="body2" sx={{ color: MUTED_TEXT, mb: 3 }}>
                    Add files, images, videos, and documents to your course library
                </Typography>
                <Button
                    variant="contained"
                    component="label"
                    htmlFor="file-upload"
                    disabled={uploading}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: PRIMARY_COLOR,
                        '&:hover': { bgcolor: PRIMARY_HOVER_BG }
                    }}
                >
                    {uploading ? 'Uploading...' : 'Browse Files'}
                </Button>

                {uploading && (
                    <Box sx={{ mt: 3, maxWidth: 400, mx: 'auto' }}>
                        <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 8, borderRadius: 4 }} />
                        <Typography variant="caption" sx={{ color: MUTED_TEXT, mt: 1, display: 'block' }}>
                            {uploadProgress}% uploaded
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Files List */}
            {loading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <LinearProgress />
                    <Typography variant="body2" sx={{ color: DISABLED_TEXT, mt: 2 }}>
                        Loading files...
                    </Typography>
                </Box>
            ) : files.length === 0 ? (
                <Box sx={{ p: 8, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: DISABLED_TEXT }}>
                        No files uploaded yet. Add resources to build your course library.
                    </Typography>
                </Box>
            ) : (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: TEXT_COLOR }}>
                            Course Files ({files.length})
                        </Typography>
                    </Box>
                    <List>
                        {files.map((file) => (
                            <ListItem
                                key={file.id}
                                sx={{
                                    border: `1px solid ${BORDER_COLOR_TRANSPARENT_LIGHT}`,
                                    borderRadius: 2,
                                    mb: 1,
                                    '&:hover': { bgcolor: CARD_BG_TRANSPARENT_LIGHT }
                                }}
                                secondaryAction={
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={() => window.open(file.url, '_blank')}
                                            sx={{ color: MUTED_TEXT }}
                                        >
                                            <DownloadIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={() => handleDeleteFile(file.id)}
                                            sx={{ color: ERROR_COLOR_MAIN }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {getFileIcon(file.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: TEXT_COLOR }}>
                                            {file.name}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                            <Chip
                                                label={formatFileSize(file.size)}
                                                size="small"
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                            />
                                            <Typography variant="caption" sx={{ color: MUTED_TEXT }}>
                                                Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </Box>
    );
}
