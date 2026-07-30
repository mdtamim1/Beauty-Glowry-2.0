import React from 'react';
import DropletGlyph from './DropletGlyph';

const FormulationReadout = ({ actives = [], title = 'FORMULATION SPECIFICATION', compact = false }) => {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: compact ? '16px' : '24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
        <DropletGlyph size={14} color="var(--accent-color)" />
        <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {actives.map((active, idx) => (
          <div key={idx}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                {active.name}
              </span>
              <span className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-color)' }}>
                {active.concentration}{active.unit || '%'}
              </span>
            </div>

            <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
              <div 
                style={{
                  width: `${Math.min(100, (active.concentration / 20) * 100)}%`,
                  height: '100%',
                  background: 'var(--accent-color)'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormulationReadout;
