import React from 'react';

// Common timezones covering the resources we seed + likely user locations
const COMMON_TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Australia/Sydney',
];

interface Props {
  value: string;
  onChange: (timezone: string) => void;
}

export default function TimezoneSelector({ value, onChange }: Props) {
  return (
    <div style={styles.wrapper}>
      <label style={styles.label} htmlFor="tz-select">
        Your Timezone
      </label>
      <select
        id="tz-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.select}
      >
        {COMMON_TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </select>
      <p style={styles.hint}>
        Slot times are displayed in this timezone. The resource has its own timezone.
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#444',
  },
  select: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.95rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    background: '#fff',
    color: '#222',
    cursor: 'pointer',
    maxWidth: '260px',
  },
  hint: {
    fontSize: '0.75rem',
    color: '#888',
  },
};

// Helper to detect the browser's local timezone via the Intl API
export function detectLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}
