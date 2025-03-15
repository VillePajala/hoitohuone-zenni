'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';

interface TimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  id,
  value,
  onChange,
  className,
  ...props
}) => {
  const [time, setTime] = useState(value);

  // Handle time change and validation
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    
    // Basic validation for HH:MM format
    const isValid = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime);
    
    if (isValid) {
      onChange(newTime);
    }
  };

  return (
    <Input
      id={id}
      type="time"
      value={time}
      onChange={handleTimeChange}
      className={className}
      {...props}
    />
  );
}; 