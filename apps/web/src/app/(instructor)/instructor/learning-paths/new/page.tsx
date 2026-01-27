'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { apiFetch } from '@shared/http/apiFetch';

// Instructor learning path creation - creates a new learning path and redirects to editor
export default function InstructorLearningPathsNewPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const createLearningPath = async () => {
            try {
                // Create a new learning path
                const newPath = await apiFetch<any>('/api/learning-paths', {
                    method: 'POST',
                    body: {
                        name: 'Untitled Learning Path',
                        status: 'DRAFT'
                    }
                });

                // Redirect to the instructor learning path editor
                router.replace(`/instructor/learning-paths/${newPath.id}/edit`);
            } catch (err: any) {
                console.error('Failed to create learning path:', err);
                setError(err.message || 'Failed to create learning path');
            }
        };

        createLearningPath();
    }, [router]);

    if (error) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
                gap: 2
            }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 2
        }}>
            <CircularProgress color="primary" />
            <Typography color="text.secondary">
                Creating new learning path...
            </Typography>
        </Box>
    );
}
