'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StoreCard from './StoreCard';
import type { Course } from '@modules/courses/store/mock';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';

interface StoreCarouselProps {
    courses: Course[];
    onAddCourse?: (id: string) => void;
}

export default function StoreCarousel({ courses, onAddCourse }: StoreCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        const scrollElement = scrollRef.current;
        if (scrollElement) {
            scrollElement.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
            return () => {
                scrollElement.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [courses]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const cardWidth = 260;
            const gap = 24;
            const scrollAmount = cardWidth + gap;
            const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            scrollRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth',
            });
        }
    };

    return (
        <Box sx={{ position: 'relative', width: '100%' }}>
            <IconButton
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                sx={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: { xs: '-10px', md: '-56px' },
                    width: '44px',
                    height: '44px',
                    bgcolor: 'hsl(var(--background) / 0.5)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${DIVIDER}`,
                    color: TEXT_COLOR,
                    zIndex: 2,
                    '&:hover': {
                        bgcolor: 'hsl(var(--background) / 0.8)',
                        borderColor: ICON_COLOR,
                    },
                    '&.Mui-disabled': {
                        opacity: 0,
                        pointerEvents: 'none'
                    },
                    borderRadius: '12px',
                    transition: 'all 0.2s'
                }}
            >
                <ChevronLeftIcon />
            </IconButton>

            <Box 
                ref={scrollRef}
                sx={{
                    display: 'flex',
                    gap: '24px',
                    overflowX: 'auto',
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                    paddingBottom: '4px',
                    mx: { xs: 0, md: 0 }
                }}
            >
                {courses.map((course) => (
                    <StoreCard
                        key={course.id}
                        {...course}
                        onAdd={onAddCourse}
                    />
                ))}
            </Box>

            <IconButton
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                sx={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    right: { xs: '-10px', md: '-56px' },
                    width: '44px',
                    height: '44px',
                    bgcolor: 'hsl(var(--background) / 0.5)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${DIVIDER}`,
                    color: TEXT_COLOR,
                    zIndex: 2,
                    '&:hover': {
                        bgcolor: 'hsl(var(--background) / 0.8)',
                        borderColor: ICON_COLOR,
                    },
                    '&.Mui-disabled': {
                        opacity: 0,
                        pointerEvents: 'none'
                    },
                    borderRadius: '12px',
                    transition: 'all 0.2s'
                }}
            >
                <ChevronRightIcon />
            </IconButton>
        </Box>
    );
}
