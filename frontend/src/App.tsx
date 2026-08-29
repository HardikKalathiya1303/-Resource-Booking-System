import React, { useEffect, useState, useCallback } from 'react';
import type { Resource, Slot } from './types';
import { fetchResources, fetchSlots } from './api/resources';
import ResourceSelector from './components/ResourceSelector';
import DatePicker from './components/DatePicker';
import SlotGrid from './components/SlotGrid';
import BookingPanel from './components/BookingPanel';
import TimezoneSelector, { detectLocalTimezone } from './components/TimezoneSelector';

export default function App() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [userTimezone, setUserTimezone] = useState(detectLocalTimezone);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Load resources once on mount
  useEffect(() => {
    fetchResources()
      .then(setResources)
      .catch(() => {/* server not running yet — silently ignore */})
      .finally(() => setResourcesLoading(false));
  }, []);

  // Load slots whenever resource, date, or user timezone changes
  const loadSlots = useCallback(async () => {
    if (!selectedResource || !selectedDate) return;

    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const data = await fetchSlots(selectedResource.id, selectedDate, userTimezone);
      setSlots(data.slots);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedResource, selectedDate, userTimezone]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  function handleResourceSelect(resource: Resource) {
    setSelectedResource(resource);
    setSelectedSlot(null);
    setSlots([]);
  }

  function handleDateChange(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  function handleTimezoneChange(tz: string) {
    setUserTimezone(tz);
    setSelectedSlot(null);
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Resource Booking</h1>
        <div style={styles.tzWrapper}>
          <TimezoneSelector value={userTimezone} onChange={handleTimezoneChange} />
        </div>
      </header>

      <main style={styles.main}>
        {/* Step 1 — pick a resource */}
        <section style={styles.section}>
          <ResourceSelector
            resources={resources}
            selected={selectedResource}
            onSelect={handleResourceSelect}
            loading={resourcesLoading}
          />
        </section>

        {/* Step 2 — pick a date */}
        {selectedResource && (
          <section style={styles.section}>
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              disabled={!selectedResource}
            />
          </section>
        )}

        {/* Step 3 — pick a slot */}
        {selectedResource && selectedDate && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Available Slots</h2>
            <SlotGrid
              slots={slots}
              selectedSlot={selectedSlot}
              onSelect={setSelectedSlot}
              loading={slotsLoading}
              userTimezone={userTimezone}
              resourceTimezone={selectedResource.timezone}
            />
          </section>
        )}

        {/* Step 4 — confirm booking */}
        {selectedSlot && selectedResource && !selectedSlot.isBooked && (
          <section style={styles.section}>
            <BookingPanel
              slot={selectedSlot}
              resource={selectedResource}
              userTimezone={userTimezone}
              onSuccess={loadSlots}
            />
          </section>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
    padding: '1.25rem 2rem',
    background: '#fff',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
  },
  tzWrapper: {
    minWidth: '200px',
  },
  main: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  section: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#444',
    marginBottom: '0.75rem',
  },
};
