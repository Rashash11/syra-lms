'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

type ToastProps = {
    message: string;
    severity?: AlertColor; // 'success' | 'info' | 'warning' | 'error'
    duration?: number;
};

type ToastContextType = {
    showToast: (message: string, severity?: AlertColor, duration?: number) => void;
    hideToast: () => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [config, setConfig] = useState<ToastProps>({
        message: '',
        severity: 'info',
        duration: 4000,
    });

    const showToast = useCallback((message: string, severity: AlertColor = 'info', duration = 4000) => {
        setConfig({ message, severity, duration });
        setOpen(true);
    }, []);

    const hideToast = useCallback(() => {
        setOpen(false);
    }, []);

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={config.duration}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleClose} 
                    severity={config.severity} 
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {config.message}
                </Alert>
            </Snackbar>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
