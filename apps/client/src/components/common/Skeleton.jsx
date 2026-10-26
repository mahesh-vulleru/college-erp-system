import React from 'react';

export const Skeleton = ({
  variant = 'text',
  className = '',
  count = 1
}) => {
  const base = 'animate-pulse bg-navy-100 rounded-md';

  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-9 w-24 rounded-lg',
    card: 'h-32 w-full rounded-xl',
    row: 'h-12 w-full'
  };

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`${base} ${variants[variant] || variants.text} ${className}`}
        />
      ))}
    </>
  );
};

export default Skeleton;

