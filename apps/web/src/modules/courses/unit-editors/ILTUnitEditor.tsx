'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Paper,
    Button,
    IconButton,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import GroupsIcon from '@mui/icons-material/Groups';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import { SessionDrawer, Session } from './session-drawer';

interface ILTUnitEditorProps {
    unitId: string;
    courseId: string;
    config: any;
    onConfigChange: (config: any) => void;
    onTitleChange?: (title: string) => void;
    title?: string;
}

export default function ILTUnitEditor({
    unitId,
    courseId,
    config,
    onConfigChange,
    onTitleChange,
    title = ''
}: ILTUnitEditorProps) {
    const [localTitle, setLocalTitle] = useState(title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [description, setDescription] = useState(config.description || '');
    const [sessions, setSessions] = useState<Session[]>(config.sessions || []);
    const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false);
    const [selectedSessionType, setSelectedSessionType] = useState<string | null>(null);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalTitle(title);
    }, [title]);

    useEffect(() => {
        setDescription(config.description || '');
        setSessions(config.sessions || []);
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

    const handleDescriptionChange = (value: string) => {
        setDescription(value);
        onConfigChange({ ...config, description: value });
    };

    const handleAddSession = (type: string) => {
        setSelectedSessionType(type);
        setEditingSession(null);
        setSessionDrawerOpen(true);
    };

    const handleSaveSession = (session: Session) => {
        const updatedSessions = editingSession
            ? sessions.map(s => s.id === editingSession.id ? session : s)
            : [...sessions, { ...session, id: Date.now().toString() }];

        setSessions(updatedSessions);
        onConfigChange({ ...config, sessions: updatedSessions });
        setSessionDrawerOpen(false);
        setEditingSession(null);
    };

    const handleDeleteSession = (sessionId: string) => {
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(updatedSessions);
        onConfigChange({ ...config, sessions: updatedSessions });
        setSessionDrawerOpen(false);
        setEditingSession(null);
    };

    const SessionTile = ({
        icon,
        title,
        subtitle,
        onClick
    }: {
        icon: React.ReactNode;
        title: string;
        subtitle: string;
        onClick: () => void;
    }) => (
        <Paper
            onClick={onClick}
            sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '1px solid rgba(141, 166, 166, 0.1)',
                borderRadius: 2,
                minHeight: 150,
                transition: 'all 0.2s',
                bgcolor: 'rgba(13, 20, 20, 0.4)',
                '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(141, 166, 166, 0.08)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }
            }}
        >
            <Box sx={{ color: 'text.secondary', mb: 2 }}>
                {icon}
            </Box>
            <Typography
                variant="body1"
                sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    textAlign: 'center',
                    mb: 0.5
                }}
            >
                {title}
            </Typography>
            <Typography
                variant="caption"
                sx={{
                    color: 'text.secondary',
                    textAlign: 'center',
                    fontSize: '0.75rem'
                }}
            >
                {subtitle}
            </Typography>
        </Paper>
    );

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
                            {localTitle || 'ILT unit'}
                        </Typography>
                    )}
                </Box>

                {/* Description */}
                <TextField
                    fullWidth
                    placeholder="Add description here"
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    variant="standard"
                    sx={{
                        '& .MuiInput-root': {
                            fontSize: '0.875rem',
                            color: 'text.secondary',
                            '&:before, &:after': { display: 'none' }
                        }
                    }}
                />
            </Box>

            {/* Sessions Section */}
            {sessions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                        There are no sessions yet!
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
                        Add sessions from the list below to create your ILT unit.
                    </Typography>

                    {/* Session Type Tiles */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, maxWidth: 800, mx: 'auto' }}>
                        <SessionTile
                            icon={<PersonIcon sx={{ fontSize: 48 }} />}
                            title="Online session"
                            subtitle="(integrated tool)"
                            onClick={() => handleAddSession('online-integrated')}
                        />
                        <SessionTile
                            icon={<HomeIcon sx={{ fontSize: 48 }} />}
                            title="In-person session"
                            subtitle=""
                            onClick={() => handleAddSession('in-person')}
                        />
                        <SessionTile
                            icon={<GroupsIcon sx={{ fontSize: 48 }} />}
                            title="Online session"
                            subtitle="(other external tools)"
                            onClick={() => handleAddSession('online-external')}
                        />
                    </Box>
                </Box>
            ) : (
                <Box>
                    {/* Sessions List */}
                    {sessions.map((session) => (
                        <Paper key={session.id} sx={{ p: 3, mb: 2, border: '1px solid rgba(141, 166, 166, 0.1)', borderRadius: 2, bgcolor: 'rgba(13, 20, 20, 0.4)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        {session.color && (
                                            <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: session.color }} />
                                        )}
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                            {session.name || 'Untitled Session'}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                        {session.date} at {session.startTime} ({session.duration} mins)
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                        Type: {session.type === 'online-integrated' ? 'Online (Integrated)' :
                                            session.type === 'in-person' ? 'In-Person' : 'Online (External)'}
                                    </Typography>
                                    {session.instructor && (
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Instructor: {session.instructor}
                                        </Typography>
                                    )}
                                </Box>
                                <Box>
                                    <IconButton size="small" onClick={() => {
                                        setEditingSession(session);
                                        setSelectedSessionType(session.type);
                                        setSessionDrawerOpen(true);
                                    }}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleDeleteSession(session.id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Paper>
                    ))}

                    {/* Add Session Button */}
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setSelectedSessionType('online-integrated');
                            setEditingSession(null);
                            setSessionDrawerOpen(true);
                        }}
                        sx={{ mt: 2, textTransform: 'none' }}
                    >
                        Add Session
                    </Button>
                </Box>
            )}

            {/* Session Drawer */}
            <SessionDrawer
                open={sessionDrawerOpen}
                onClose={() => {
                    setSessionDrawerOpen(false);
                    setEditingSession(null);
                }}
                sessionType={selectedSessionType}
                session={editingSession}
                onSave={handleSaveSession}
                onDelete={handleDeleteSession}
            />

            {/* Settings Button */}
            <Box sx={{ position: 'fixed', bottom: 24, right: 24 }}>
                <IconButton
                    sx={{
                        bgcolor: 'background.paper',
                        border: '1px solid rgba(141, 166, 166, 0.1)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.08)' }
                    }}
                >
                    <SettingsIcon />
                </IconButton>
            </Box>
        </Box>
    );
}
