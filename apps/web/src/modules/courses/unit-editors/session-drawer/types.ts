// Types for the Session Drawer components

export interface SessionNotification {
    id: string;
    type: 'email' | 'notification';
    minutesBefore: number;
}

export interface SessionFormData {
    name: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    allDay: boolean;
    timezone: string;
    repeatRule: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    instructor: string;
    location?: string;
    description?: string;
    color: string;
    capacity?: number;
    // Meeting
    hasMeeting: boolean;
    meetingProvider: 'zedny' | 'zoom' | 'meet' | 'custom';
    meetingUrl?: string;
    // Notifications
    notifications: SessionNotification[];
    // Visibility
    availability: 'busy' | 'free';
    visibility: 'default' | 'private' | 'public';
}

export interface Session {
    id: string;
    type: 'online-integrated' | 'in-person' | 'online-external';
    name: string;
    date: string;
    startTime: string;
    endTime?: string;
    instructor?: string;
    duration: number;
    durationUnit: 'minutes' | 'hours';
    description?: string;
    color?: string;
    location?: string;
    capacity?: string;
    maxAttendees?: number;
    // Extended fields
    allDay?: boolean;
    timezone?: string;
    repeatRule?: string;
    hasMeeting?: boolean;
    meetingProvider?: string;
    meetingUrl?: string;
    notifications?: SessionNotification[];
    availability?: 'busy' | 'free';
    visibility?: 'default' | 'private' | 'public';
}

export interface SessionDrawerHeaderProps {
    title: string;
    onTitleChange: (title: string) => void;
    onClose: () => void;
    onSave: () => void;
    isSaveDisabled: boolean;
}

export interface DateTimeRowProps {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    allDay: boolean;
    timezone: string;
    repeatRule: string;
    onStartDateChange: (date: string) => void;
    onStartTimeChange: (time: string) => void;
    onEndDateChange: (date: string) => void;
    onEndTimeChange: (time: string) => void;
    onAllDayChange: (allDay: boolean) => void;
    onTimezoneChange: (tz: string) => void;
    onRepeatRuleChange: (rule: string) => void;
}

export interface MeetingBlockProps {
    hasMeeting: boolean;
    meetingProvider: string;
    meetingUrl?: string;
    isExternalTool?: boolean;
    onToggleMeeting: (hasMeeting: boolean) => void;
    onProviderChange: (provider: string) => void;
    onUrlChange: (url: string) => void;
    onRemoveMeeting: () => void;
}

export interface NotificationsSectionProps {
    notifications: SessionNotification[];
    onAddNotification: () => void;
    onRemoveNotification: (id: string) => void;
    onUpdateNotification: (id: string, updates: Partial<SessionNotification>) => void;
}

export interface SessionDrawerFooterProps {
    onCancel: () => void;
    onDelete?: () => void;
    isEditing: boolean;
}
