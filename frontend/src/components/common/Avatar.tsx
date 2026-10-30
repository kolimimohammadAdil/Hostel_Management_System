import React, { useState, useEffect } from 'react';
import { getResolvedAvatarUrl, getInitials } from '../../utils/avatar';
import { User } from 'lucide-react';

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'rounded' | 'square';
  className?: string;
  showBorder?: boolean;
  borderColor?: string;
  fallbackGradient?: string;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  alt,
  size = 'md',
  shape = 'circle',
  className = '',
  showBorder = false,
  borderColor = 'border-slate-200 dark:border-slate-800',
  fallbackGradient = 'from-blue-600 to-indigo-600',
}) => {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = getResolvedAvatarUrl(src);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const shapeClasses =
    shape === 'circle'
      ? 'rounded-full'
      : shape === 'rounded'
      ? 'rounded-2xl'
      : 'rounded-lg';

  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;
  const borderClasses = showBorder ? `border-2 ${borderColor}` : '';

  if (resolvedUrl && !hasError) {
    return (
      <img
        src={resolvedUrl}
        alt={alt || name || 'User profile'}
        onError={() => setHasError(true)}
        className={`${sizeClasses} ${shapeClasses} ${borderClasses} object-cover shadow-xs shrink-0 select-none ${className}`}
        loading="lazy"
      />
    );
  }

  // Graceful fallback: Stylized initials or default user icon
  const initials = getInitials(name);

  return (
    <div
      aria-label={alt || name || 'User avatar'}
      className={`${sizeClasses} ${shapeClasses} ${borderClasses} bg-gradient-to-tr ${fallbackGradient} text-white flex items-center justify-center font-bold tracking-wider shadow-xs shrink-0 select-none ${className}`}
    >
      {initials ? initials : <User className="w-1/2 h-1/2 opacity-80" />}
    </div>
  );
};

export default Avatar;

