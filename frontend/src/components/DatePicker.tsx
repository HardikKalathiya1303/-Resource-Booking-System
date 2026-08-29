import React from 'react';

interface Props {
  value: string;      // "YYYY-MM-DD"
  onChange: (date: string) => void;
  disabled?: boolean;
}

export default function DatePicker({ value, onChange, disabled }: Props) {
  // Today's date in local time as the minimum selectable date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <h2 style={styles.label}>Select a Date</h2>
      <input
        type="date"
        value={value}
        min={today}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...styles.input,
          ...(disabled ? styles.inputDisabled : {}),
        }}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  label: {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
    color: '#444',
  },
  input: {
    padding: '0.5rem 0.75rem',
    fontSize: '1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    cursor: 'pointer',
    background: '#fff',
    color: '#222',
  },
  inputDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};
