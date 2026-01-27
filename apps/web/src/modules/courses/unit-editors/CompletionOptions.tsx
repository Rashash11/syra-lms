'use client';

import React from 'react';
import {
    Box,
    Typography,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    Switch,
    Collapse,
} from '@mui/material';

interface CompletionConfig {
    mode: 'button' | 'timer' | 'question';
    timerSeconds?: number;
    syncWithVideo?: boolean;
    question?: {
        text: string;
        correctAnswer: string;
    };
}

interface CompletionOptionsProps {
    config: CompletionConfig;
    onChange: (config: CompletionConfig) => void;
    videoDuration?: number; // For video units with sync option
}

export default function CompletionOptions({
    config,
    onChange,
    videoDuration,
}: CompletionOptionsProps) {
    const [expanded, setExpanded] = React.useState(false);

    const handleModeChange = (mode: 'button' | 'timer' | 'question') => {
        onChange({ ...config, mode });
    };

    const handleTimerChange = (seconds: number) => {
        onChange({ ...config, timerSeconds: seconds });
    };

    const handleSyncToggle = (sync: boolean) => {
        if (sync && videoDuration) {
            onChange({ ...config, syncWithVideo: true, timerSeconds: videoDuration });
        } else {
            onChange({ ...config, syncWithVideo: false });
        }
    };

    const handleQuestionChange = (field: 'text' | 'correctAnswer', value: string) => {
        onChange({
            ...config,
            question: {
                ...config.question,
                text: field === 'text' ? value : config.question?.text || '',
                correctAnswer: field === 'correctAnswer' ? value : config.question?.correctAnswer || '',
            },
        });
    };

    return (
        <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(141, 166, 166, 0.05)', borderRadius: 2 }}>
            <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, cursor: 'pointer' }}
                onClick={() => setExpanded(!expanded)}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Completion Options
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {expanded ? 'Hide' : 'Show'}
                </Typography>
            </Box>

            <Collapse in={expanded}>
                <Box sx={{ mt: 2 }}>
                    {/* Completion Mode */}
                    <FormControl component="fieldset">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                            Mark as complete when:
                        </Typography>
                        <RadioGroup
                            value={config.mode}
                            onChange={(e) => handleModeChange(e.target.value as 'button' | 'timer' | 'question')}
                        >
                            <FormControlLabel
                                value="button"
                                control={<Radio />}
                                label="User clicks complete button"
                            />
                            <FormControlLabel
                                value="timer"
                                control={<Radio />}
                                label="Timer expires"
                            />
                            <FormControlLabel
                                value="question"
                                control={<Radio />}
                                label="User answers a question correctly"
                            />
                        </RadioGroup>
                    </FormControl>

                    {/* Timer Options */}
                    {config.mode === 'timer' && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                                Timer Duration (seconds)
                            </Typography>
                            <TextField
                                type="number"
                                fullWidth
                                value={config.timerSeconds || ''}
                                onChange={(e) => handleTimerChange(parseInt(e.target.value) || 0)}
                                placeholder="Enter duration in seconds"
                                sx={{
                                    maxWidth: 200,
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'background.paper',
                                    },
                                }}
                            />

                            {/* Sync with Video option */}
                            {videoDuration && (
                                <Box sx={{ mt: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={config.syncWithVideo || false}
                                                onChange={(e) => handleSyncToggle(e.target.checked)}
                                            />
                                        }
                                        label={`Sync with video duration (${Math.floor(videoDuration)} seconds)`}
                                    />
                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                                        Automatically complete when video ends
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Question Options */}
                    {config.mode === 'question' && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                                Completion Question
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                value={config.question?.text || ''}
                                onChange={(e) => handleQuestionChange('text', e.target.value)}
                                placeholder="Enter your question"
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'background.paper',
                                    },
                                }}
                            />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                                Correct Answer
                            </Typography>
                            <TextField
                                fullWidth
                                value={config.question?.correctAnswer || ''}
                                onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                                placeholder="Enter the correct answer"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'background.paper',
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {/* Info */}
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(141, 166, 166, 0.08)', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            💡 <strong>Tip:</strong> Choose the completion method that best fits your content.
                            Timer mode is great for videos, while question mode helps ensure learners understand the material.
                        </Typography>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}
