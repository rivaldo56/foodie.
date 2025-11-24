'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';

export interface CalendarEvent {
    id: number | string;
    title: string;
    date: Date;
    type: 'booking' | 'personal';
    description?: string;
    startTime?: string;
    endTime?: string;
}

interface CalendarWidgetProps {
    events?: CalendarEvent[];
    onDateSelect?: (date: Date) => void;
    onAddEvent?: (date: Date) => void;
}

export default function CalendarWidget({ events = [], onDateSelect, onAddEvent }: CalendarWidgetProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    const getEventsForDate = (date: Date) => {
        return events.filter(event =>
            event.date.getDate() === date.getDate() &&
            event.date.getMonth() === date.getMonth() &&
            event.date.getFullYear() === date.getFullYear()
        );
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleDateClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(date);
        onDateSelect?.(date);
    };

    const addToGoogleCalendar = (event: CalendarEvent) => {
        const start = event.date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const end = new Date(event.date.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, ""); // Default 1 hour

        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description || '')}`;
        window.open(url, '_blank');
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

    const selectedDayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

    return (
        <div className="bg-surface-elevated border border-white/5 rounded-3xl p-6 shadow-lg flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 rounded-xl hover:bg-white/5 transition-colors text-white/50 hover:text-white"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h3 className="text-lg font-semibold text-white">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h3>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 rounded-xl hover:bg-white/5 transition-colors text-white/50 hover:text-white"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
                {onAddEvent && (
                    <button
                        onClick={() => onAddEvent(selectedDate || new Date())}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-white text-xs font-semibold hover:bg-accent-strong transition"
                    >
                        <Plus className="h-3 w-3" />
                        Add Event
                    </button>
                )}
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
                {daysOfWeek.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-white/30 py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2 mb-6">
                {emptyDays.map(i => (
                    <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {days.map(day => {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dayEvents = getEventsForDate(date);
                    const hasBooking = dayEvents.some(e => e.type === 'booking');
                    const hasPersonal = dayEvents.some(e => e.type === 'personal');
                    const isTodayDate = isToday(date);
                    const isSelected = selectedDate?.getDate() === day &&
                        selectedDate?.getMonth() === currentDate.getMonth() &&
                        selectedDate?.getFullYear() === currentDate.getFullYear();

                    return (
                        <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={`aspect-square rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-center relative ${isSelected
                                ? 'bg-white/10 text-white border border-white/20'
                                : isTodayDate
                                    ? 'bg-white/5 text-white border border-accent/50'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {day}
                            <div className="flex gap-1 mt-1">
                                {hasBooking && <div className="h-1.5 w-1.5 rounded-full bg-accent" />}
                                {hasPersonal && <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Selected Day Events */}
            <div className="border-t border-white/10 pt-4 flex-1">
                <h4 className="text-sm font-semibold text-white mb-3">
                    {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
                </h4>

                {selectedDayEvents.length === 0 ? (
                    <p className="text-xs text-white/40 italic">No events scheduled</p>
                ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {selectedDayEvents.map((event, idx) => (
                            <div key={idx} className={`p-3 rounded-xl border ${event.type === 'booking' ? 'bg-accent/10 border-accent/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className={`text-sm font-medium ${event.type === 'booking' ? 'text-accent' : 'text-blue-400'}`}>
                                            {event.title}
                                        </p>
                                        {event.description && <p className="text-xs text-white/60 mt-1">{event.description}</p>}
                                    </div>
                                    {event.type === 'booking' && (
                                        <button
                                            onClick={() => addToGoogleCalendar(event)}
                                            className="text-white/40 hover:text-white transition"
                                            title="Add to Google Calendar"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
