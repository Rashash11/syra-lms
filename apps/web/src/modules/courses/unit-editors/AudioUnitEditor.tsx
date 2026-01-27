'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Paper,
    Button,
} from '@mui/material';
import MediaRecorderDialog from './MediaRecorderDialog';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MicIcon from '@mui/icons-material/Mic';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import { getCsrfToken } from '@/lib/client-csrf';

interface AudioUnitEditorProps {
    unitId: string;
    courseId: string;
    config: any;
    onConfigChange: (config: any) => void;
    onTitleChange?: (title: string) => void;
    title?: string;
}

export default function AudioUnitEditor({
    unitId,
    courseId,
    config,
    onConfigChange,
    onTitleChange,
    title = ''
}: AudioUnitEditorProps) {
    const [localTitle, setLocalTitle] = useState(title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [recorderOpen, setRecorderOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalTitle(title);
    }, [title]);

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
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('courseId', courseId);
            formData.append('unitId', unitId);
            formData.append('kind', 'audio');

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'x-csrf-token': getCsrfToken() },
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            const { url, name, size } = data.file;

            onConfigChange({
                ...config,
                audioUrl: url,
                fileName: name,
                fileSize: size,
                source: 'upload',
                content: { type: 'upload', url: url, fileName: name }
            });
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
            // Fallback to blob if upload fails (though persistence will fail)
            const objectUrl = URL.createObjectURL(file);
            onConfigChange({
                ...config,
                audioUrl: objectUrl,
                fileName: file.name,
                fileSize: file.size,
                source: 'upload',
                content: { type: 'upload', url: objectUrl, fileName: file.name }
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
        if (file && file.type.startsWith('audio/')) {
            handleFileUpload(file);
        }
    };

    const handleChangeAudio = () => {
        onConfigChange({
            ...config,
            audioUrl: '',
            fileName: '',
            fileSize: undefined,
            source: null,
            content: null
        });
    };

    const audioUrl = config.audioUrl || config.content?.url || '';
    const hasAudio = audioUrl && (config.source === 'upload' || config.source === 'record');

    return (
        <Box sx={{ minHeight: '60vh' }}>
            <Box sx={{ mb: 3 }}>
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
                                    color: 'text.primary',
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
                                color: 'text.primary',
                                fontFamily: '"Inter", "Segoe UI", sans-serif',
                                cursor: 'text',
                                '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.05)', borderRadius: '4px' }
                            }}
                        >
                            {localTitle || 'Audio unit'}
                        </Typography>
                    )}
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Add content
                </Typography>
            </Box>

            <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {!hasAudio ? (
                <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2, mt: 4 }}>
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
                                borderRadius: 2,
                                minHeight: 350,
                                bgcolor: isDragging ? 'primary.dark' : 'primary.main',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                }
                            }}
                        >
                            <CloudUploadIcon sx={{ fontSize: 56, color: 'primary.contrastText', mb: 2 }} />
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'primary.contrastText',
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    fontSize: '1rem'
                                }}
                            >
                                Upload a file
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'rgba(255,255,255,0.7)',
                                    textAlign: 'center',
                                    mt: 0.5
                                }}
                            >
                                or Drag-n-Drop here
                            </Typography>
                        </Paper>

                        <Paper
                            onClick={() => setRecorderOpen(true)}
                            sx={{
                                p: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                border: '1px solid rgba(141, 166, 166, 0.1)',
                                borderRadius: 2,
                                minHeight: 350,
                                bgcolor: 'rgba(13, 20, 20, 0.4)',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'rgba(141, 166, 166, 0.08)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }
                            }}
                        >
                            <MicIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'primary.main',
                                    fontWeight: 500,
                                    textAlign: 'center'
                                }}
                            >
                                Record audio
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
                                    bgcolor: 'background.paper',
                                    fontSize: '0.875rem'
                                }
                            }}
                        />
                    </Box>
                </>
            ) : (
                <Box sx={{ mt: 4 }}>
                    <Paper sx={{
                        p: 4,
                        bgcolor: 'rgba(13, 20, 20, 0.4)',
                        border: '1px solid rgba(141, 166, 166, 0.1)',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3
                    }}>
                        <GraphicEqIcon sx={{
                            fontSize: 56,
                            color: config.source === 'record' ? 'error.main' : 'primary.main'
                        }} />
                        <Box sx={{ flex: 1 }}>
                            {config.fileName && (
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                                    {config.fileName}
                                </Typography>
                            )}
                            {config.source === 'record' && (
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'error.main', mb: 1 }}>
                                    Recorded Audio
                                </Typography>
                            )}
                            <audio src={audioUrl} controls style={{ width: '100%' }} />
                        </Box>
                    </Paper>

                    <Button
                        variant="outlined"
                        onClick={handleChangeAudio}
                        sx={{ mt: 2, textTransform: 'none' }}
                    >
                        Change audio
                    </Button>
                </Box>
            )}

            <MediaRecorderDialog
                open={recorderOpen}
                onClose={() => setRecorderOpen(false)}
                onRecordingComplete={async (blob: Blob) => {
                    const file = new File([blob], `recorded-audio-${Date.now()}.webm`, { type: 'audio/webm' });
                    await handleFileUpload(file);
                    setRecorderOpen(false);
                }}
                mode="audio"
            />
        </Box>
    );
}
