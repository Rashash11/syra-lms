'use client';

import React, { useState, useRef } from 'react';
import { Box, Typography, Paper, Button, TextField, CircularProgress, Alert, Radio, RadioGroup, FormControlLabel, Checkbox, FormControl, FormLabel, LinearProgress } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import CodeIcon from '@mui/icons-material/Code';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TimerIcon from '@mui/icons-material/Timer';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import SendIcon from '@mui/icons-material/Send';

import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import { apiFetch } from '@/shared/http/apiFetch';
import { getCsrfToken } from '@/shared/security/csrf';

interface UnitRendererProps {
    unit: {
        id: string;
        type: string;
        title: string;
        content: any;
    };
}

interface TestPlayerProps {
    unit: {
        id: string;
        type: string;
        title: string;
        content: any;
    };
}

function TestPlayer({ unit }: TestPlayerProps) {
    const questions = unit.content?.questions || [];
    const [currentStep, setCurrentStep] = useState(0); // 0: Start, 1+: Question Index + 1, last: Result
    const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
    const [testFinished, setTestFinished] = useState(false);
    const [score, setScore] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);

    const handleStart = () => setCurrentStep(1);

    const handleAnswer = (questionId: string, answer: any) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const calculateResult = () => {
        let currentScore = 0;
        let total = 0;

        questions.forEach((q: any) => {
            total += (q.points || 1);
            const userAnswer = userAnswers[q.id];

            if (q.type === 'single') {
                const correctId = q.answers.find((a: any) => a.correct)?.id;
                if (userAnswer === correctId) currentScore += (q.points || 1);
            } else if (q.type === 'multiple') {
                const correctIds = q.answers.filter((a: any) => a.correct).map((a: any) => a.id);
                const isCorrect = Array.isArray(userAnswer) &&
                    userAnswer.length === correctIds.length &&
                    userAnswer.every(id => correctIds.includes(id));
                if (isCorrect) currentScore += (q.points || 1);
            } else if (q.type === 'free_text') {
                // Manual grading needed, but let's count as 0 for now
            }
        });

        setScore(currentScore);
        setTotalPoints(total);
        setTestFinished(true);
        setCurrentStep(questions.length + 1);
    };

    if (questions.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">This test has no questions.</Typography>
            </Box>
        );
    }

    // Results Screen
    if (testFinished && currentStep > questions.length) {
        const percent = Math.round((score / totalPoints) * 100);
        const passed = percent >= (unit.content?.passScore || 60);

        return (
            <Box sx={{ py: 4, textAlign: 'center' }}>
                {passed ? (
                    <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                ) : (
                    <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                )}
                <Typography variant="h4" gutterBottom fontWeight={800}>
                    {passed ? 'Congratulations!' : 'Keep Practicing!'}
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, color: 'text.secondary' }}>
                    You scored {score} out of {totalPoints} ({percent}%)
                </Typography>
                <Box sx={{ maxWidth: 400, mx: 'auto', mb: 4 }}>
                    <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{ height: 12, borderRadius: 6, bgcolor: 'action.hover' }}
                        color={passed ? 'success' : 'error'}
                    />
                </Box>
                <Button variant="contained" size="large" onClick={() => {
                    setCurrentStep(0);
                    setTestFinished(false);
                    setUserAnswers({});
                }}>
                    Retake Test
                </Button>
            </Box>
        );
    }

    // Intro Screen
    if (currentStep === 0) {
        return (
            <Box sx={{ py: 2 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>{unit.title}</Typography>
                <Box sx={{ mt: 2, mb: 4 }} dangerouslySetInnerHTML={{ __html: unit.content?.html || '' }} />

                <Paper variant="outlined" sx={{ p: 3, mb: 4, bgcolor: 'action.hover', border: 'none' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimerIcon color="primary" />
                            <Typography variant="body2">Duration: {unit.content?.duration || 'No limit'} mins</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon color="primary" />
                            <Typography variant="body2">Pass Score: {unit.content?.passScore || 60}%</Typography>
                        </Box>
                    </Box>
                </Paper>

                <Button variant="contained" size="large" onClick={handleStart} fullWidth sx={{ py: 1.5, fontSize: '1.1rem' }}>
                    Start Test
                </Button>
            </Box>
        );
    }

    // Question Screen
    const qIndex = currentStep - 1;
    const q = questions[qIndex];
    const isLast = currentStep === questions.length;

    return (
        <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="caption" fontWeight={700} color="primary" sx={{ letterSpacing: 1, textTransform: 'uppercase' }}>
                    Question {currentStep} of {questions.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Points: {q.points || 1}
                </Typography>
            </Box>

            <Typography variant="h6" sx={{ mb: 4, fontWeight: 600 }}>{q.text}</Typography>

            <FormControl component="fieldset" fullWidth>
                {q.type === 'single' ? (
                    <RadioGroup
                        value={userAnswers[q.id] || ''}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                    >
                        {q.answers.map((a: any) => (
                            <Paper
                                key={a.id}
                                variant="outlined"
                                sx={{
                                    mb: 1.5,
                                    p: 1,
                                    borderColor: userAnswers[q.id] === a.id ? 'primary.main' : 'divider',
                                    bgcolor: userAnswers[q.id] === a.id ? 'primary.light' : 'transparent',
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <FormControlLabel
                                    value={a.id}
                                    control={<Radio size="small" />}
                                    label={a.text}
                                    sx={{ width: '100%', m: 0 }}
                                />
                            </Paper>
                        ))}
                    </RadioGroup>
                ) : q.type === 'multiple' ? (
                    <Box>
                        {q.answers.map((a: any) => {
                            const current = userAnswers[q.id] || [];
                            const checked = current.includes(a.id);
                            return (
                                <Paper
                                    key={a.id}
                                    variant="outlined"
                                    sx={{
                                        mb: 1.5,
                                        p: 1,
                                        borderColor: checked ? 'primary.main' : 'divider',
                                        bgcolor: checked ? 'primary.light' : 'transparent',
                                        '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={checked}
                                                onChange={(e) => {
                                                    const newAnswers = e.target.checked
                                                        ? [...current, a.id]
                                                        : current.filter((id: string) => id !== a.id);
                                                    handleAnswer(q.id, newAnswers);
                                                }}
                                            />
                                        }
                                        label={a.text}
                                        sx={{ width: '100%', m: 0 }}
                                    />
                                </Paper>
                            );
                        })}
                    </Box>
                ) : (
                    <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        placeholder="Type your answer..."
                        value={userAnswers[q.id] || ''}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                    />
                )}
            </FormControl>

            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    disabled={currentStep === 1}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    startIcon={<NavigateBeforeIcon />}
                >
                    Previous
                </Button>
                {isLast ? (
                    <Button
                        variant="contained"
                        color="success"
                        onClick={calculateResult}
                        endIcon={<SendIcon />}
                        sx={{ px: 4 }}
                    >
                        Finish Test
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        endIcon={<NavigateNextIcon />}
                        sx={{ px: 4 }}
                    >
                        Next
                    </Button>
                )}
            </Box>
        </Box>
    );
}

export default function UnitRenderer({ unit }: UnitRendererProps) {
    // Assignment state
    const [activeSubmissionType, setActiveSubmissionType] = useState<string | null>(null);
    const [submissionText, setSubmissionText] = useState('');
    const [submissionFile, setSubmissionFile] = useState<{ id: string; url: string; name: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        const form = new FormData();
        form.append('file', file);

        try {
            // Use fetch directly for upload as apiFetch handles JSON bodies by default
            const resp = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'x-csrf-token': getCsrfToken() || '' },
                body: form
            });

            if (!resp.ok) throw new Error('Upload failed');
            const data = await resp.json();

            // data.file contains { id, url, name, ... }
            if (data.file) {
                setSubmissionFile({
                    id: data.file.id,
                    url: data.file.url,
                    name: file.name
                });
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setError('Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!activeSubmissionType) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const payload: any = {
                assignmentUnitId: unit.id,
            };

            if (activeSubmissionType === 'text') {
                if (!submissionText.trim()) {
                    throw new Error('Please enter some text');
                }
                payload.content = submissionText;
            } else if (activeSubmissionType === 'file') {
                if (!submissionFile) {
                    throw new Error('Please upload a file');
                }
                payload.fileId = submissionFile.id;
            } else {
                // TODO: Implement other types
                throw new Error('This submission type is not fully implemented yet');
            }

            await apiFetch('/api/submissions', {
                method: 'POST',
                body: payload
            });

            setSubmitSuccess(true);
            // Optional: Reset state or show success message
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.message || 'Failed to submit assignment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetSelection = () => {
        setActiveSubmissionType(null);
        setSubmissionText('');
        setSubmissionFile(null);
        setError(null);
        setSubmitSuccess(false);
    };

    const renderContent = () => {
        // Debug logs
        if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === '1') {
            console.log('🎬 UnitRenderer:', { type: unit.type, title: unit.title, content: unit.content });
        }

        // Helper to convert YouTube URL to embed URL
        const getEmbedUrl = (url: string) => {
            if (!url) return '';

            // Extract video ID from various YouTube URL formats
            let videoId: string | null = null;

            // youtube.com/watch?v=VIDEO_ID
            const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
            if (watchMatch && watchMatch[1]) videoId = watchMatch[1] as string;

            // youtu.be/VIDEO_ID
            const shortMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (shortMatch && shortMatch[1]) videoId = shortMatch[1] as string;

            // youtube.com/embed/VIDEO_ID (already embed)
            const embedMatch = url.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
            if (embedMatch) return url; // Already an embed URL

            // If we found a video ID, create proper embed URL
            if (videoId) {
                const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === '1') {
                    console.log('🔄 URL Conversion:', url, '→', embedUrl);
                }
                return embedUrl;
            }

            // If it's not a YouTube URL, return as-is (might be uploaded video)
            return url;
        };

        switch (unit.type) {
            case 'TEXT':
                return (
                    <Box
                        component="div"
                        className="tiptap-content"
                        dangerouslySetInnerHTML={{
                            __html: unit.content?.body || unit.content?.text || unit.content?.content || ''
                        }}
                    />
                );
            case 'VIDEO':
                // Support multiple config structures
                const videoUrl = unit.content?.url || unit.content?.videoUrl || unit.content?.content?.url || '';
                if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === '1') {
                    console.log('📹 VIDEO DEBUG:', { videoUrl, fullContent: unit.content });
                }
                const embedVideoUrl = getEmbedUrl(videoUrl);
                if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === '1') {
                    console.log('🎯 Final Embed URL:', embedVideoUrl);
                }

                if (!videoUrl) {
                    return (
                        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                            <Typography>No video configured</Typography>
                        </Box>
                    );
                }

                return (
                    <Box sx={{ position: 'relative', pt: '56.25%', width: '100%', bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
                        <iframe
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            src={embedVideoUrl}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </Box>
                );
            case 'DOCUMENT':
                const docUrl = unit.content?.url || unit.content?.documentUrl || '';
                const docFileName = unit.content?.fileName || '';
                if (!docUrl) {
                    return (
                        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                            <Typography>No document configured</Typography>
                        </Box>
                    );
                }
                const isPdf = docFileName.toLowerCase().endsWith('.pdf') || docUrl.toLowerCase().endsWith('.pdf');
                const isSlideshare = unit.content?.type === 'slideshare' || (docUrl.includes('slideshare.net'));
                if (isPdf) {
                    return (
                        <Box sx={{ width: '100%', height: { xs: 400, md: 640 }, bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
                            <iframe
                                style={{ width: '100%', height: '100%' }}
                                src={docUrl}
                            />
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary', fontFamily: 'monospace', p: 1, textAlign: 'center' }}>
                                {docFileName || docUrl}
                            </Typography>
                        </Box>
                    );
                }
                if (isSlideshare) {
                    return (
                        <Box sx={{ width: '100%' }}>
                            <Box sx={{ position: 'relative', pt: '56.25%', width: '100%', borderRadius: 1, overflow: 'hidden', bgcolor: 'background.paper' }}>
                                <iframe
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                    src={docUrl}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Button variant="outlined" href={docUrl} target="_blank" sx={{ mt: 2, textTransform: 'none' }}>
                                    Open
                                </Button>
                            </Box>
                        </Box>
                    );
                }
                return (
                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="body1">{docFileName || 'Document'}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                            {unit.content?.fileSize ? `${(unit.content.fileSize / (1024)).toFixed(1)} KB` : ''}
                        </Typography>
                        <Button variant="contained" href={docUrl} target="_blank" sx={{ mt: 2 }}>
                            Open
                        </Button>
                    </Box>
                );
            case 'AUDIO':
                const audioSource = unit.content?.url || unit.content?.audioUrl || unit.content?.content?.url || '';

                if (!audioSource) {
                    return (
                        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                            <Typography>No audio configured</Typography>
                        </Box>
                    );
                }

                return (
                    <Box sx={{ p: 0 }}>
                        <Paper sx={{
                            p: 4,
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3
                        }}>
                            <Box sx={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                bgcolor: 'action.hover',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <GraphicEqIcon sx={{ fontSize: 32, color: '#3182ce' }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                {unit.content?.fileName && (
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
                                        {unit.content.fileName}
                                    </Typography>
                                )}
                                <audio src={audioSource} controls style={{ width: '100%' }} />
                                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary', fontFamily: 'monospace' }}>
                                    Debug URL: {audioSource}
                                </Typography>
                            </Box>
                        </Paper>
                        {unit.content?.description && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                                <Typography variant="body1" color="text.secondary">
                                    {unit.content.description}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                );
            case 'FILE':
                return (
                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="body1">File: {unit.content?.filename || 'Unnamed file'}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                            Size: {unit.content?.filesize ? `${(unit.content.filesize / 1024).toFixed(2)} KB` : 'Unknown'}
                        </Typography>
                        {unit.content?.url && (
                            <Button
                                variant="contained"
                                href={unit.content.url}
                                target="_blank"
                                sx={{ mt: 2 }}
                            >
                                Download
                            </Button>
                        )}
                    </Box>
                );
            case 'EMBED':
                return (
                    <Box component="div" dangerouslySetInnerHTML={{ __html: unit.content?.html || '' }} />
                );
            case 'IFRAME':
                const iframeUrl = unit.content?.iframeUrl || unit.content?.url || unit.content?.externalUrl || '';
                if (!iframeUrl) {
                    return (
                        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                            <Typography>No iframe URL configured</Typography>
                        </Box>
                    );
                }
                return (
                    <Box sx={{ width: '100%', height: { xs: 500, md: 700 }, bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <iframe
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            src={iframeUrl}
                            allowFullScreen
                            title={unit.title}
                        />
                    </Box>
                );
            case 'TEST':
            case 'QUIZ':
                return <TestPlayer unit={unit} />;
            case 'SCORM':
                const scormUrl = unit.content?.launchUrl || unit.content?.url || unit.content?.externalUrl;
                if (!scormUrl) {
                    return (
                        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                            <Typography sx={{ mb: 1, fontWeight: 600 }}>No SCORM launch URL configured</Typography>
                            <Typography variant="body2">Provide launchUrl or externalUrl in unit config.</Typography>
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'left' }}>
                                <Typography variant="caption" component="pre">
                                    Debug Info: {JSON.stringify(unit.content, null, 2)}
                                </Typography>
                            </Box>
                        </Box>
                    );
                }
                return (
                    <Box sx={{ position: 'relative', pt: '56.25%', width: '100%', borderRadius: 1, overflow: 'hidden', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                        <iframe
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            src={scormUrl}
                            frameBorder="0"
                            allow="fullscreen"
                            title={unit.title}
                        />
                    </Box>
                );
            case 'ASSIGNMENT':
                if (submitSuccess) {
                    return (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                            <Typography variant="h5" sx={{ mb: 2 }}>Assignment Submitted!</Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Your assignment has been successfully submitted.
                            </Typography>
                            <Button variant="outlined" onClick={resetSelection}>
                                Submit Another Response
                            </Button>
                        </Box>
                    );
                }

                if (activeSubmissionType) {
                    return (
                        <Box sx={{ p: 2 }}>
                            <Button
                                startIcon={<ArrowBackIcon />}
                                onClick={resetSelection}
                                sx={{ mb: 3 }}
                            >
                                Back to options
                            </Button>

                            <Typography variant="h6" sx={{ mb: 3 }}>
                                {activeSubmissionType === 'text' && 'Text Submission'}
                                {activeSubmissionType === 'file' && 'File Upload'}
                                {activeSubmissionType === 'video' && 'Video Recording'}
                                {activeSubmissionType === 'audio' && 'Audio Recording'}
                                {activeSubmissionType === 'screen' && 'Screen Recording'}
                            </Typography>

                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {error}
                                </Alert>
                            )}

                            {activeSubmissionType === 'text' && (
                                <Box>
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={6}
                                        placeholder="Type your answer here..."
                                        value={submissionText}
                                        onChange={(e) => setSubmissionText(e.target.value)}
                                        disabled={isSubmitting}
                                        sx={{ mb: 3 }}
                                    />
                                </Box>
                            )}

                            {activeSubmissionType === 'file' && (
                                <Box sx={{ mb: 3 }}>
                                    {!submissionFile ? (
                                        <Box
                                            sx={{
                                                border: '2px dashed',
                                                borderColor: 'divider',
                                                borderRadius: 2,
                                                p: 4,
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                                            }}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input
                                                type="file"
                                                hidden
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                            />
                                            {uploading ? (
                                                <CircularProgress />
                                            ) : (
                                                <>
                                                    <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                                    <Typography>Click to upload a file</Typography>
                                                </>
                                            )}
                                        </Box>
                                    ) : (
                                        <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <InsertDriveFileIcon color="primary" />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2">{submissionFile.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">Ready to submit</Typography>
                                            </Box>
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={() => setSubmissionFile(null)}
                                                disabled={isSubmitting}
                                            >
                                                Remove
                                            </Button>
                                        </Paper>
                                    )}
                                </Box>
                            )}

                            {(['video', 'audio', 'screen'].includes(activeSubmissionType)) && (
                                <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2, mb: 3 }}>
                                    <Typography color="text.secondary">
                                        Recording feature is coming soon.
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || (activeSubmissionType === 'file' && !submissionFile) || (activeSubmissionType === 'text' && !submissionText)}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                                </Button>
                            </Box>
                        </Box>
                    );
                }

                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body1" sx={{ color: '#4a5568', mb: 4 }}>
                            {unit.content?.body || unit.content?.text || 'No instructions provided.'}
                        </Typography>

                        <Typography variant="subtitle2" sx={{ color: '#718096', mb: 2, fontWeight: 600 }}>
                            Select a way to answer the current assignment
                        </Typography>

                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
                            gap: 2
                        }}>
                            {[
                                { id: 'text', label: 'Text', icon: <DescriptionIcon sx={{ fontSize: '2.5rem' }} /> },
                                { id: 'file', label: 'Upload a file', icon: <InsertDriveFileIcon sx={{ fontSize: '2.5rem' }} /> },
                                { id: 'video', label: 'Record video', icon: <OndemandVideoIcon sx={{ fontSize: '2.5rem' }} /> },
                                { id: 'audio', label: 'Record audio', icon: <DescriptionIcon sx={{ fontSize: '2.5rem' }} /> }, // TODO: Mic icon
                                { id: 'screen', label: 'Record screen', icon: <CodeIcon sx={{ fontSize: '2.5rem' }} /> },
                            ].map((option) => (
                                <Paper
                                    key={option.id}
                                    variant="outlined"
                                    onClick={() => setActiveSubmissionType(option.id)}
                                    sx={{
                                        p: 3,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 2,
                                        cursor: 'pointer',
                                        borderColor: 'divider',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'action.hover'
                                        }
                                    }}
                                >
                                    <Box sx={{ color: '#4a5568' }}>{option.icon}</Box>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', textAlign: 'center' }}>
                                        {option.label}
                                    </Typography>
                                </Paper>
                            ))}
                        </Box>
                    </Box>
                );
            case 'ILT':
                const sessions = unit.content?.sessions || [];

                if (sessions.length === 0) {
                    return (
                        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                            <Typography>No sessions scheduled yet.</Typography>
                        </Box>
                    );
                }

                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {unit.content?.description && (
                            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                                {unit.content.description}
                            </Typography>
                        )}

                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                            Scheduled Sessions
                        </Typography>

                        {sessions.map((session: any) => (
                            <Paper
                                key={session.id}
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    bgcolor: 'background.default',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    gap: 2
                                }}
                            >
                                {/* Color indicator */}
                                {session.color && (
                                    <Box sx={{
                                        width: 4,
                                        height: '100%',
                                        minHeight: 60,
                                        borderRadius: 1,
                                        bgcolor: session.color,
                                        display: { xs: 'none', sm: 'block' }
                                    }} />
                                )}

                                {/* Session details */}
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                        {session.name || 'Untitled Session'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        📅 {session.date} at {session.startTime}
                                        {session.duration && ` (${session.duration} mins)`}
                                    </Typography>
                                    {session.instructor && (
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            👤 Instructor: {session.instructor}
                                        </Typography>
                                    )}
                                    {session.location && (
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            📍 Location: {session.location}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" sx={{
                                        display: 'inline-block',
                                        mt: 1,
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        bgcolor: session.type === 'in-person' ? 'warning.main' : 'info.main',
                                        color: 'white'
                                    }}>
                                        {session.type === 'online-integrated' ? '🎥 Online (Zedny Meet)' :
                                            session.type === 'in-person' ? '🏢 In-Person' : '🔗 Online (External)'}
                                    </Typography>
                                </Box>

                                {/* Join button for online sessions */}
                                {session.meetingUrl && session.hasMeeting && (
                                    <Button
                                        variant="contained"
                                        href={session.meetingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            bgcolor: 'primary.main',
                                            '&:hover': { bgcolor: 'primary.dark' }
                                        }}
                                    >
                                        Join Meeting
                                    </Button>
                                )}
                            </Paper>
                        ))}
                    </Box>
                );
            default:
                return (
                    <Box sx={{ p: 10, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            Content type "{unit.type}" renderer not yet implemented.
                        </Typography>
                    </Box>
                );
        }
    };

    return (
        <Box sx={{ py: 2 }}>
            <Paper className="glass-card" variant="outlined" sx={{ p: 4, minHeight: 400 }}>
                {renderContent()}
            </Paper>
        </Box>
    );
}
