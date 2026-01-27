'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Paper,
    Button,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { getCsrfToken } from '@/lib/client-csrf';

const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const PRIMARY_COLOR = 'hsl(var(--primary))';
const ERROR_COLOR = 'hsl(var(--destructive))';
const SECONDARY_COLOR = 'hsl(var(--secondary))';
const CARD_BG_OPAQUE = 'hsl(var(--card))';
const CARD_BG_TRANSPARENT_LIGHT = 'hsl(var(--card) / 0.05)';
const CARD_BG_TRANSPARENT_LIGHT_HOVER = 'hsl(var(--card) / 0.08)';
const CARD_BG_TRANSPARENT_MEDIUM = 'hsl(var(--card) / 0.4)';
const BORDER_COLOR_TRANSPARENT = 'hsl(var(--border) / 0.1)';
const SHADOW_COLOR_DARK = 'rgba(0,0,0,0.2)';
const PRIMARY_HOVER_BG = 'hsl(var(--primary) / 0.9)';

interface DocumentUnitEditorProps {
    unitId: string;
    courseId: string;
    config: any;
    onConfigChange: (config: any) => void;
    onTitleChange?: (title: string) => void;
    title?: string;
}

export default function DocumentUnitEditor({
    unitId,
    courseId,
    config,
    onConfigChange,
    onTitleChange,
    title = ''
}: DocumentUnitEditorProps) {
    const [localTitle, setLocalTitle] = useState(title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [selectedSource, setSelectedSource] = useState<string | null>(config.source || null);
    const [slideshareUrl, setSlideshareUrl] = useState(config.documentUrl || '');
    const [isDragging, setIsDragging] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalTitle(title);
    }, [title]);

    useEffect(() => {
        if (config.source) {
            setSelectedSource(config.source);
        }
        if (config.documentUrl) {
            setSlideshareUrl(config.documentUrl);
        }
    }, [config]);

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        if (localTitle.trim() && localTitle !== title) {
            onTitleChange?.(localTitle);
        } else {
            setLocalTitle(title);
        }
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleTitleBlur();
        if (e.key === 'Escape') {
            setLocalTitle(title);
            setIsEditingTitle(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        const form = new FormData();
        form.append('file', file);
        try {
            const resp = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'x-csrf-token': getCsrfToken() },
                body: form
            });
            if (!resp.ok) throw new Error('Upload failed');
            const data = await resp.json();
            const url = data?.file?.url || '';
            const size = data?.file?.size || file.size;
            onConfigChange({
                ...config,
                documentUrl: url,
                fileName: file.name,
                fileSize: size,
                source: 'upload',
                content: { type: 'upload', url, fileName: file.name }
            });
            setSelectedSource('upload');
        } catch (e) {
            onConfigChange({
                ...config,
                documentUrl: '',
                fileName: file.name,
                fileSize: file.size,
                source: null,
                content: null
            });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleSlideshareSubmit = () => {
        if (slideshareUrl.trim()) {
            onConfigChange({
                ...config,
                documentUrl: slideshareUrl,
                source: 'slideshare',
                content: { type: 'slideshare', url: slideshareUrl }
            });
        }
    };

    const handleChangeDocument = () => {
        setSelectedSource(null);
        setSlideshareUrl('');
        onConfigChange({
            ...config,
            documentUrl: '',
            fileName: '',
            fileSize: undefined,
            source: null,
            content: null
        });
    };

    const getFileIcon = (fileName?: string) => {
        if (!fileName) return <InsertDriveFileIcon sx={{ fontSize: 56, color: PRIMARY_COLOR }} />;
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <PictureAsPdfIcon sx={{ fontSize: 56, color: ERROR_COLOR }} />;
        if (['doc', 'docx'].includes(ext || '')) return <DescriptionIcon sx={{ fontSize: 56, color: PRIMARY_COLOR }} />;
        if (['ppt', 'pptx'].includes(ext || '')) return <SlideshowIcon sx={{ fontSize: 56, color: SECONDARY_COLOR }} />;
        return <InsertDriveFileIcon sx={{ fontSize: 56, color: MUTED_TEXT }} />;
    };

    const getFileType = (fileName?: string) => {
        if (!fileName) return 'Document';
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return 'PDF Document';
        if (['doc', 'docx'].includes(ext || '')) return 'Word Document';
        if (['ppt', 'pptx'].includes(ext || '')) return 'PowerPoint Presentation';
        if (['xls', 'xlsx'].includes(ext || '')) return 'Excel Spreadsheet';
        return 'Document';
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const documentUrl = config.documentUrl || '';
    const hasDocument = documentUrl && (config.source === 'upload' || config.source === 'slideshare');

    return (
        <Box sx={{ minHeight: '60vh' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                {/* Title */}
                <Box sx={{ mb: 1 }}>
                    {isEditingTitle ? (
                        <TextField
                            variant="standard"
                            value={localTitle}
                            onChange={(e) => setLocalTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleTitleKeyDown}
                            autoFocus
                            inputRef={titleInputRef}
                            fullWidth
                            sx={{
                                '& .MuiInput-root': {
                                    fontSize: '1.75rem',
                                    fontWeight: 700,
                                    color: TEXT_COLOR,
                                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                                    '&:before, &:after': { display: 'none' }
                                },
                                '& input': { padding: '4px 0' }
                            }}
                        />
                    ) : (
                        <Typography
                                variant="h1"
                                onClick={() => setIsEditingTitle(true)}
                                sx={{
                                    fontSize: '1.75rem',
                                    fontWeight: 700,
                                    color: TEXT_COLOR,
                                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                                    cursor: 'text',
                                    '&:hover': { bgcolor: CARD_BG_TRANSPARENT_LIGHT, borderRadius: '4px' }
                                }}
                            >
                            {localTitle || 'Document unit'}
                        </Typography>
                    )}
                </Box>
                <Typography variant="body2" sx={{ color: MUTED_TEXT }}>
                    Add content
                </Typography>
            </Box>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {/* Content Area */}
            {!hasDocument ? (
                <>
                    {/* Source Selection - TalentLMS style */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 4 }}>
                        {/* Upload Tile */}
                        <Paper
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            sx={{
                                p: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                border: isDragging ? '2px solid' : `1px solid ${BORDER_COLOR_TRANSPARENT}`,
                            borderColor: isDragging ? PRIMARY_COLOR : BORDER_COLOR_TRANSPARENT,
                            borderRadius: 2,
                            minHeight: 350,
                            bgcolor: isDragging ? CARD_BG_TRANSPARENT_LIGHT : CARD_BG_TRANSPARENT_MEDIUM,
                            transition: 'all 0.2s',
                            '&:hover': {
                                borderColor: PRIMARY_COLOR,
                                bgcolor: CARD_BG_TRANSPARENT_LIGHT_HOVER,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 12px ${SHADOW_COLOR_DARK}`
                            }
                            }}
                        >
                            <CloudUploadIcon sx={{ fontSize: 56, color: MUTED_TEXT, mb: 2 }} />
                            <Typography
                                variant="body1"
                                sx={{
                                    color: TEXT_COLOR,
                                    fontWeight: 500,
                                    textAlign: 'center'
                                }}
                            >
                                Upload a file
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: PRIMARY_COLOR,
                                    textAlign: 'center',
                                    mt: 0.5,
                                    fontSize: '0.75rem'
                                }}
                            >
                                or Drag-n-Drop here
                            </Typography>
                        </Paper>

                        {/* Slideshare Tile */}
                        <Paper
                            onClick={() => setSelectedSource('slideshare')}
                            sx={{
                                p: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                border: `1px solid ${BORDER_COLOR_TRANSPARENT}`,
                                borderRadius: 2,
                                minHeight: 350,
                                bgcolor: CARD_BG_TRANSPARENT_MEDIUM,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: PRIMARY_COLOR,
                                    bgcolor: CARD_BG_TRANSPARENT_LIGHT_HOVER,
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 4px 12px ${SHADOW_COLOR_DARK}`
                                }
                            }}
                        >
                            <SlideshowIcon sx={{ fontSize: 56, color: MUTED_TEXT, mb: 2 }} />
                            <Typography
                                variant="body1"
                                sx={{
                                    color: PRIMARY_COLOR,
                                    fontWeight: 500,
                                    textAlign: 'center'
                                }}
                            >
                                Use Slideshare
                            </Typography>
                        </Paper>
                    </Box>

                    {/* Add content text field */}
                    <Box sx={{ mt: 4 }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            placeholder="Add content"
                            value={config.description || ''}
                            onChange={(e) => onConfigChange({ ...config, description: e.target.value })}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: CARD_BG_OPAQUE,
                                    fontSize: '0.875rem'
                                }
                            }}
                        />
                    </Box>
                </>
            ) : (
                // Document Preview
                <Box sx={{ mt: 4 }}>
                    <Paper sx={{
                        p: 4,
                        bgcolor: CARD_BG_TRANSPARENT_MEDIUM,
                        border: `1px solid ${BORDER_COLOR_TRANSPARENT}`,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3
                    }}>
                        {getFileIcon(config.fileName)}
                        <Box sx={{ flex: 1 }}>
                            {config.fileName && (
                                <>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: TEXT_COLOR }}>
                                        {config.fileName}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: MUTED_TEXT }}>
                                        {getFileType(config.fileName)} • {formatFileSize(config.fileSize)}
                                    </Typography>
                                </>
                            )}
                            {config.source === 'slideshare' && (
                                <>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: TEXT_COLOR }}>
                                        Slideshare Presentation
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: MUTED_TEXT,
                                            wordBreak: 'break-all',
                                            mt: 0.5
                                        }}
                                    >
                                        {documentUrl.length > 60 ? documentUrl.substring(0, 60) + '...' : documentUrl}
                                    </Typography>
                                </>
                            )}
                        </Box>
                        {documentUrl && (
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => window.open(documentUrl, '_blank')}
                                sx={{ textTransform: 'none' }}
                            >
                                {config.source === 'upload' && config.fileName?.endsWith('.pdf') ? 'Preview' : 'Open'}
                            </Button>
                        )}
                    </Paper>

                    <Button
                        variant="outlined"
                        onClick={handleChangeDocument}
                        sx={{ mt: 2, textTransform: 'none' }}
                    >
                        Change document
                    </Button>
                </Box>
            )}

            {/* Slideshare URL input - shows when slideshare is selected but no URL yet */}
            {selectedSource === 'slideshare' && !hasDocument && (
                <Box sx={{ mt: 4 }}>
                    <Paper sx={{ p: 4, border: '1px solid rgba(141, 166, 166, 0.1)', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Enter Slideshare URL
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                value={slideshareUrl}
                                onChange={(e) => setSlideshareUrl(e.target.value)}
                                placeholder="https://www.slideshare.net/..."
                                variant="outlined"
                                size="small"
                            />
                            <Button
                                variant="contained"
                                onClick={handleSlideshareSubmit}
                                disabled={!slideshareUrl.trim()}
                                sx={{
                                    textTransform: 'none',
                                    bgcolor: PRIMARY_COLOR,
                                    '&:hover': { bgcolor: PRIMARY_HOVER_BG }
                                }}
                            >
                                Add Document
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            )}
        </Box>
    );
}
