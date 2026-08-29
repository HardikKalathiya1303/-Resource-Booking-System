import React, { useState } from 'react';
import { Slot, Resource, ApiError } from '../types';
import { createBooking } from '../api/resources';
import { AxiosError } from 'axios';

interface Props {
  slot: Slot;
  resource: Resource;
  userTimezone: string;
  onSuccess: () => void; // refresh slots after booking
}

type Status = 'idle' | 'loading' | 'success' | 'conflict' | 'error';

export default function BookingPanel({ slot, resource, userTimezone, onSuccess }: Props) {
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const showBothZones = userTimezone !== resource.timezone;

  async function handleBook() {
    if (!userId.trim()) {
      setErrorMsg('Please enter your name or user ID.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      await createBooking(resource.id, userId.trim(), slot.startUtc, slot.endUtc);
      setStatus('success');
      onSuccess();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const statusCode = axiosErr.response?.status;
      const message = axiosErr.response?.data?.message ?? 'Something went wrong.';

      if (statusCode === 409) {
        setStatus('conflict');
      } else {
        setStatus('error');
        setErrorMsg(typeof message === 'string' ? message : message[0]);
      }
    }
  }

  if (status === 'success') {
    return (
      <div style={{ ...styles.panel, ...styles.success }}>
        <span style={styles.icon}>✓</span>
        <div>
          <strong>Booking confirmed!</strong>
          <p style={styles.detail}>
            {resource.name} · {slot.startDisplay}–{slot.endDisplay} ({userTimezone})
          </p>
        </div>
      </div>
    );
  }

  if (status === 'conflict') {
    return (
      <div style={{ ...styles.panel, ...styles.conflict }}>
        <span style={styles.icon}>✗</span>
        <div>
          <strong>Slot already taken</strong>
          <p style={styles.detail}>
            Someone else booked this slot just now. Please pick a different time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Confirm Booking</h3>

      <div style={styles.slotInfo}>
        <div style={styles.row}>
          <span style={styles.rowLabel}>Resource</span>
          <span>{resource.name}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.rowLabel}>Time (your timezone)</span>
          <span style={styles.mono}>
            {slot.startDisplay}–{slot.endDisplay}
            <span style={styles.tzTag}> {userTimezone}</span>
          </span>
        </div>
        {showBothZones && (
          <div style={styles.row}>
            <span style={styles.rowLabel}>Time (room's timezone)</span>
            <span style={styles.mono}>
              {slot.startLocal}–{slot.endLocal}
              <span style={styles.tzTag}> {resource.timezone}</span>
            </span>
          </div>
        )}
      </div>

      <label style={styles.inputLabel} htmlFor="user-id">
        Your name / user ID
      </label>
      <input
        id="user-id"
        type="text"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="e.g. alice"
        style={styles.input}
        onKeyDown={(e) => e.key === 'Enter' && handleBook()}
        disabled={status === 'loading'}
      />

      {status === 'error' && (
        <p style={styles.errorText}>{errorMsg}</p>
      )}

      <button
        onClick={handleBook}
        disabled={status === 'loading'}
        style={{
          ...styles.button,
          ...(status === 'loading' ? styles.buttonDisabled : {}),
        }}
      >
        {status === 'loading' ? 'Booking…' : 'Book this slot'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: '#fff',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  success: {
    borderColor: '#86efac',
    background: '#f0fdf4',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  conflict: {
    borderColor: '#fca5a5',
    background: '#fff1f2',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  icon: {
    fontSize: '1.4rem',
    lineHeight: 1,
    marginTop: '0.1rem',
  },
  title: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#222',
    margin: 0,
  },
  slotInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    background: '#f9fafb',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '0.875rem',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  rowLabel: {
    color: '#666',
    flexShrink: 0,
  },
  mono: {
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#222',
  },
  tzTag: {
    fontWeight: 400,
    color: '#888',
    fontSize: '0.8em',
  },
  detail: {
    fontSize: '0.875rem',
    color: '#555',
    margin: '0.2rem 0 0',
  },
  inputLabel: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#444',
  },
  input: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.95rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    color: '#222',
  },
  errorText: {
    color: '#dc2626',
    fontSize: '0.82rem',
    margin: 0,
  },
  button: {
    padding: '0.65rem 1.25rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};
