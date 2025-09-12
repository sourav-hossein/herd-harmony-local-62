
import React from 'react';

interface CircularProgressBarProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({ 
  progress,
  size = 80,
  strokeWidth = 8,
  color = '#10b981' // emerald-500
}) => {
  const viewBox = `0 0 ${size} ${size}`;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size} viewBox={viewBox}>
        <circle
          className="text-gray-200 dark:text-gray-700"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="transition-all duration-500 ease-in-out"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      <span className="absolute text-lg font-bold" style={{ color }}>
        {`${Math.round(progress)}%`}
      </span>
    </div>
  );
};

export default CircularProgressBar;
