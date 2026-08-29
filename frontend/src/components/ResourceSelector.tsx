import React from 'react';
import type { Resource } from '../types';

interface Props {
  resources: Resource[];
  selected: Resource | null;
  onSelect: (resource: Resource) => void;
  loading: boolean;
}

export default function ResourceSelector({ resources, selected, onSelect, loading }: Props) {
  if (loading) {
    return <p style={styles.hint}>Loading resources…</p>;
  }

  return (
    <div>
      <h2 style={styles.label}>Select a Resource</h2>
      <div style={styles.grid}>
        {resources.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            style={{
              ...styles.card,
              ...(selected?.id === r.id ? styles.cardActive : {}),
            }}
          >
            <strong style={styles.name}>{r.name}</strong>
            <span style={styles.tz}>{r.timezone}</span>
            <span style={styles.desc}>{r.description}</span>
          </button>
        ))}
      </div>
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '0.75rem',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  cardActive: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59,130,246,0.15)',
  },
  name: {
    fontSize: '0.95rem',
    color: '#222',
  },
  tz: {
    fontSize: '0.78rem',
    color: '#3b82f6',
    fontFamily: 'monospace',
  },
  desc: {
    fontSize: '0.78rem',
    color: '#888',
    marginTop: '0.2rem',
  },
  hint: {
    color: '#888',
    fontSize: '0.9rem',
  },
};
