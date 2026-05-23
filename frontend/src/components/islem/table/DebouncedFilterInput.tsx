import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { TextField } from '@mui/material';

interface DebouncedFilterInputProps {
  placeholder: string;
  onChange: (value: string) => void;
  sx?: any;
}

/**
 * Kendi state'ini yöneten debounced input — parent'ı her tuş vuruşunda
 * yeniden render etmez. 120ms gecikme + onChangeRef pattern legacy
 * `IslemTable.tsx` içindeki inline versiyonu ile bit-for-bit aynıdır.
 */
const DebouncedFilterInput: React.FC<DebouncedFilterInputProps> = memo(({ placeholder, onChange, sx }) => {
  const [localValue, setLocalValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChangeRef.current(val);
    }, 120);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      sx={sx || { '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '100%' }}
    />
  );
});

export default DebouncedFilterInput;
