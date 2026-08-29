import React from 'react';
import type { Slot } from '../types';

interface Props {
  slots: Slot[];
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
  loading: boolean;
  userTimezone: string;
  resourceTimezone: string;
}

export default function SlotGrid({
  slots,
  selectedSlot,
  onSelect,
  loading,
  userTimezone,
  resourceTimezone,
}: Props) {
  if (loading) {
    return <p style={styles.hint}>Loading slots…</p>;
  }

  if (slots.length === 0) {
    return (
      <p style={styles.hint}>
        No available slots for this day — the resource may not be open.
      </p>
    );
  }

  const showBothZones = userTimezone !== resourceTimezone;

  return (
    <div>
      <div style={styles.legend}>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: '#22c55e' }} /> Available
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: '#e5e7eb' }} /> Booked
        </span>
        {showBothZones && (
          <span style={styles.tzNote}>
            Showing in <strong>{userTimezone}</strong>
            &nbsp;· Resource is in <strong>{resourceTimezone}</strong>
          </span>
        )}
      </div>

      <div style={styles.grid}>
        {slots.map((slot) => {
          const isSelected = selectedSlot?.startUtc === slot.startUtc;
          const isBooked = slot.isBooked;

          return (
            <button
              key={slot.startUtc}
              disabled={isBooked}
              onClick={() => !isBooked && onSelect(slot)}
              style={{
                ...styles.slot,
                ...(isBooked ? styles.slotBooked : styles.slotAvailable),
                ...(isSelected ? styles.slotSelected : {}),
              }}
              title={
                isBooked
                  ? 'Already booked'
                  : showBothZones
                  ? `${slot.startLocal}–${slot.endLocal} ${resourceTimezone}`
                  : undefined
              }
            >
              <span style={styles.time}>
                {slot.startDisplay}–{slot.endDisplay}
              </span>
              {isBooked && <span style={styles.badge}>Booked</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hint: {
    color: '#888',
    fontSize: '0.9rem',
    fontStyle: 'italic',
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.75rem',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.82rem',
    color: '#555',
  },
  dot: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  tzNote: {
    fontSize: '0.78rem',
    color: '#888',
    marginLeft: 'auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '0.5rem',
  },
  slot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.2rem',
    padding: '0.6rem 0.5rem',
    borderRadius: '8px',
    border: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.15s',
  },
  slotAvailable: {
    background: '#f0fdf4',
    borderColor: '#86efac',
    color: '#166534',
  },
  slotBooked: {
    background: '#f3f4f6',
    borderColor: '#e5e7eb',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  slotSelected: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59,130,246,0.2)',
  },
  time: {
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  badge: {
    fontSize: '0.65rem',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};
