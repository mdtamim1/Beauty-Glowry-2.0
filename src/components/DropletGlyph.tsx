import React from 'react';

interface DropletGlyphProps {
  size?: number;
  color?: string;
  className?: string;
}

const DropletGlyph: React.FC<DropletGlyphProps> = ({ size = 16, color = "#8FA88C", className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path 
        d="M12 2.5C12 2.5 5 10 5 15.5C5 19.09 7.91 22 11.5 22C15.09 22 18 19.09 18 15.5C18 10 12 2.5 12 2.5Z" 
        fill={color} 
        fillOpacity="0.15"
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M10 16L11.5 17.5L15 13" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default DropletGlyph;
