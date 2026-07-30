import React from 'react';
import DropletGlyph from './DropletGlyph';
import { ActiveIngredient } from '../data/products';

interface FormulationReadoutProps {
  actives: ActiveIngredient[];
  title?: string;
  compact?: boolean;
}

const FormulationReadout: React.FC<FormulationReadoutProps> = ({ 
  actives = [], 
  title = 'FORMULATION SPECIFICATION', 
  compact = false 
}) => {
  return (
    <div className={`bg-bg-secondary border border-soft-border rounded-md shadow-xs ${compact ? 'p-4' : 'p-6'}`}>
      
      <div className="flex items-center gap-2 mb-4 border-b border-soft-border pb-2">
        <DropletGlyph size={14} color="var(--premium-green)" />
        <span className="font-mono text-xs font-semibold text-premium-green tracking-wider uppercase">
          {title}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {actives.map((active, idx) => (
          <div key={idx}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm font-semibold text-dark-text">
                {active.name}
              </span>
              <span className="font-mono text-base font-bold text-premium-green">
                {active.concentration}{active.unit || '%'}
              </span>
            </div>

            <div className="w-full h-1 bg-bg-primary rounded-full overflow-hidden">
              <div 
                className="h-full bg-premium-green transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, (active.concentration / 20) * 100)}%`,
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
