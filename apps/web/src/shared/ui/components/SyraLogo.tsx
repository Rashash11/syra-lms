import React from 'react';
import { Box, BoxProps } from '@mui/material';

export const SyraLogo: React.FC<BoxProps & { color?: string }> = ({ color = 'currentColor', ...props }) => {
    return (
        <Box {...props} sx={{ display: 'inline-flex', alignItems: 'center', color, ...props.sx }}>
            <svg viewBox="0 0 280 60" height="100%" width="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Icon: Modern Geometric Lightning S */}
                <path 
                    d="M35 10 L15 35 L30 35 L20 55 L45 25 L30 25 L35 10Z" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                />
                
                {/* Text: SYRA - Custom Geometry to match the modern look */}
                <g transform="translate(60, 10)">
                    {/* S */}
                    <path d="M30 0 H5 C2 0 0 2 0 5 V15 C0 18 2 20 5 20 H25 C28 20 30 22 30 25 V35 C30 38 28 40 25 40 H0" 
                        stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    {/* Y */}
                    <path d="M40 0 L55 20 L70 0 M55 20 V40" 
                        stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    {/* R */}
                    <path d="M80 40 V0 H100 C110 0 110 20 100 20 H80 M100 20 L115 40" 
                        stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    {/* A */}
                    <path d="M125 40 L140 0 L155 40 M130 28 H150" 
                        stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
            </svg>
        </Box>
    );
};
