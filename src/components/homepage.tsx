import React, { useState } from 'react';
import './homepage.css';
import { ChevronLeft, ChevronRight, Heart, Zap, Circle, Cloud } from 'lucide-react';

type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';

interface Cycle {
    startDate: Date;
    currentDay: number;
    phase: CyclePhase;
}

interface JournalEntry {
    id: string;
    date: string;
    content: string;
    mood: 'happy' | 'energetic' | 'neutral' | 'sad';
    symptoms: string[];
    cycleDay: number;
    notes?: string;
    voice_note?: string | null;
}

interface HomepageProps {
    currentCycle: Cycle;
    journalEntries: JournalEntry[];
}

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const moodIcons: Record<JournalEntry['mood'], React.ReactElement> = {
    happy: <Heart className="mood-icon happy" />,
    energetic: <Zap className="mood-icon energetic" />,
    neutral: <Circle className="mood-icon neutral" />,
    sad: <Cloud className="mood-icon sad" />
};

const Homepage: React.FC<HomepageProps> = ({ currentCycle, journalEntries }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [periodStart, setPeriodStart] = useState('');
    const [userCycle, setUserCycle] = useState<Cycle>(currentCycle);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showPeriodForm, setShowPeriodForm] = useState(false);

    const formattedEntries = journalEntries.map(e => ({ ...e, notes: e.content || '', voice_note: e.voice_note || null }));

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear(), month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    };

    const getCyclePhase = (day: number | null): CyclePhase => {
        if (!day || !userCycle.startDate) return 'unknown';
        const cycleDay = Math.floor((new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getTime() - userCycle.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const normalized = ((cycleDay - 1) % 28) + 1;
        if (normalized <= 5) return 'menstrual';
        if (normalized <= 13) return 'follicular';
        if (normalized <= 15) return 'ovulatory';
        return 'luteal';
    };

    const getMoodForDay = (day: number | null) => {
        if (!day) return undefined;
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return formattedEntries.find(e => e.date === dateStr)?.mood;
    };

    const navigateMonth = (direction: number) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));

    const handleCycleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!periodStart) return;
        const start = new Date(periodStart);
        const day = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const phase: CyclePhase = day <= 5 ? 'menstrual' : day <= 13 ? 'follicular' : day <= 15 ? 'ovulatory' : 'luteal';
        setUserCycle({ startDate: start, currentDay: Math.max(1, day), phase });
        setShowPeriodForm(false);
    };

    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const calculateNextPeriod = () => userCycle.startDate ? formatDate(new Date(userCycle.startDate.getTime() + 28 * 24 * 60 * 60 * 1000)) : 'Unknown';
    const calculateFertileWindow = () => {
        if (!userCycle.startDate) return 'Unknown';
        const start = new Date(userCycle.startDate.getTime() + 10 * 24 * 60 * 60 * 1000);
        const end = new Date(userCycle.startDate.getTime() + 17 * 24 * 60 * 60 * 1000);
        return `${formatDate(start)}–${formatDate(end)}`;
    };

    const days = getDaysInMonth(currentDate);
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
    const cycleDay = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - new Date(userCycle.startDate.getFullYear(), userCycle.startDate.getMonth(), userCycle.startDate.getDate()).getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return (
        <div className="page-container">
            <div className="cycle-status">
                <div className="cycle-day">Day <strong>{cycleDay}</strong> of your cycle</div>
                <div className="cycle-phase">{userCycle.phase.charAt(0).toUpperCase() + userCycle.phase.slice(1)} Phase</div>
            </div>

            {showPeriodForm && (
                <form className="cycle-form" onSubmit={handleCycleSubmit}>
                    <label>
                        Period Start Date:
                        <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required />
                    </label>
                    <div className="form-buttons">
                        <button type="submit">Update Cycle</button>
                        <button type="button" onClick={() => setShowPeriodForm(false)}>Cancel</button>
                    </div>
                </form>
            )}

            <div className="calendar-card">
                <div className="calendar-header-top">
                    <h2 className="calendar-title">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                    <div className="calendar-controls">
                        <button className="add-period-btn" onClick={() => setShowPeriodForm(true)} type="button">+ Add Period</button>
                        <div className="calendar-nav">
                            <button onClick={() => navigateMonth(-1)} aria-label="Previous Month"><ChevronLeft /></button>
                            <button onClick={() => navigateMonth(1)} aria-label="Next Month"><ChevronRight /></button>
                        </div>
                    </div>
                </div>

                <div className="calendar-legend">
                    {['menstrual','follicular','ovulatory','luteal'].map(phase => <span key={phase} className={`badge ${phase}`}>{phase.charAt(0).toUpperCase() + phase.slice(1)}</span>)}
                </div>

                <div className="calendar-days">{daysOfWeek.map(d => <div key={d} className="day-label">{d}</div>)}</div>

                <div className="calendar-grid">
                    {days.map((day, idx) => {
                        if (!day) return <div key={idx} className="day-empty"></div>;
                        const phase = getCyclePhase(day);
                        const mood = getMoodForDay(day);
                        const isToday = isCurrentMonth && day === today.getDate();
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        return (
                            <div key={day} className={`day-cell ${phase} ${isToday ? 'today' : ''}`} onClick={() => setSelectedDate(dateStr)}>
                                <span className={`mood-dot ${mood ? 'active' : ''}`}></span>
                                <span className="day-number">{day}</span>
                                {mood && moodIcons[mood]}
                            </div>
                        );
                    })}
                </div>

                <div className="cycle-info">
                    <div><span>Cycle Day:</span> <strong>{cycleDay}</strong></div>
                    <div><span>Phase:</span> <strong>{userCycle.phase.charAt(0).toUpperCase() + userCycle.phase.slice(1)}</strong></div>
                    <div><span>Next Period:</span> <strong>{calculateNextPeriod()}</strong></div>
                    <div><span>Fertile Window:</span> <strong>{calculateFertileWindow()}</strong></div>
                </div>

                {selectedDate && (
                    <div className="journal-details show">
                        <div className="journal-header">
                            <h3>Details for {selectedDate}</h3>
                            <button className="close-button" onClick={() => setSelectedDate(null)}>×</button>
                        </div>
                        {(() => {
                            const entry = formattedEntries.find(e => e.date === selectedDate);
                            if (!entry) return <p>No journal entry for this day.</p>;
                            return (
                                <div className="journal-entry">
                                    <p><strong>Mood:</strong> {entry.mood}</p>
                                    <p><strong>Symptoms:</strong> {entry.symptoms.join(', ') || 'None'}</p>
                                    <p><strong>Notes:</strong> {entry.notes || 'No notes'}</p>
                                    {entry.voice_note && <p><strong>Voice Note:</strong> {entry.voice_note}</p>}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Homepage;
