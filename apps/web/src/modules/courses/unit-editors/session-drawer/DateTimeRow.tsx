'use client';

import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    FormControl,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RepeatIcon from '@mui/icons-material/Repeat';
import PublicIcon from '@mui/icons-material/Public';
import { DateTimeRowProps } from './types';

const TIMEZONES = [
    { value: 'Africa/Cairo', label: '(GMT+02:00) Cairo' },
    { value: 'Europe/London', label: '(GMT+00:00) London' },
    { value: 'America/New_York', label: '(GMT-05:00) New York' },
    { value: 'America/Los_Angeles', label: '(GMT-08:00) Los Angeles' },
    { value: 'Asia/Dubai', label: '(GMT+04:00) Dubai' },
];

const REPEAT_OPTIONS = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
];

export default function DateTimeRow({
    startDate,
    startTime,
    endDate,
    endTime,
    allDay,
    timezone,
    repeatRule,
    onStartDateChange,
    onStartTimeChange,
    onEndDateChange,
    onEndTimeChange,
    onAllDayChange,
    onTimezoneChange,
    onRepeatRuleChange,
}: DateTimeRowProps) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Start Date/Time Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, flexWrap: 'wrap' }}>
                    <TextField
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        size="small"
                        sx={{
                            minWidth: 140,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'background.paper',
                                borderRadius: '4px',
                            }
                        }}
                    />
                    {!allDay && (
                        <TextField
                            type="time"
                            value={startTime}
                            onChange={(e) => onStartTimeChange(e.target.value)}
                            size="small"
                            sx={{
                                width: 110,
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'background.paper',
                                    borderRadius: '4px',
                                }
                            }}
                        />
                    )}
                    <Typography sx={{ color: 'text.secondary', mx: 1 }}>–</Typography>
                    {!allDay && (
                        <TextField
                            type="time"
                            value={endTime}
                            onChange={(e) => onEndTimeChange(e.target.value)}
                            size="small"
                            sx={{
                                width: 110,
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'background.paper',
                                    borderRadius: '4px',
                                }
                            }}
                        />
                    )}
                    <TextField
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        size="small"
                        sx={{
                            minWidth: 140,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'background.paper',
                                borderRadius: '4px',
                            }
                        }}
                    />
                </Box>
            </Box>

            {/* All Day + Timezone Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pl: 4 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={allDay}
                            onChange={(e) => onAllDayChange(e.target.checked)}
                            size="small"
                        />
                    }
                    label={<Typography variant="body2" sx={{ color: 'text.secondary' }}>All day</Typography>}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PublicIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select
                            value={timezone}
                            onChange={(e) => onTimezoneChange(e.target.value)}
                            sx={{
                                bgcolor: 'background.paper',
                                '& .MuiSelect-select': { py: 0.75 }
                            }}
                        >
                            {TIMEZONES.map((tz) => (
                                <MenuItem key={tz.value} value={tz.value}>
                                    {tz.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* Repeat Rule Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <RepeatIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                        value={repeatRule}
                        onChange={(e) => onRepeatRuleChange(e.target.value)}
                        sx={{
                            bgcolor: 'background.paper',
                            '& .MuiSelect-select': { py: 0.75 }
                        }}
                    >
                        {REPEAT_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        </Box>
    );
}
