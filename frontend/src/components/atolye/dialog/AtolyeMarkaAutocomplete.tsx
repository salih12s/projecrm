import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { Marka } from '../../../types';

interface Props {
  markalar: Marka[];
  value: string;
  inputValue: string;
  setInputValue: (v: string) => void;
  onChange: (isim: string) => void;
}

const AtolyeMarkaAutocomplete: React.FC<Props> = ({ markalar, value, inputValue, setInputValue, onChange }) => (
  <Autocomplete
    options={markalar.map((m) => m.isim)}
    value={value || null}
    inputValue={inputValue}
    filterOptions={(options, state) => {
      if (!state.inputValue) return options;
      return options.filter(option =>
        option.toLocaleLowerCase('tr-TR').includes(state.inputValue.toLocaleLowerCase('tr-TR'))
      );
    }}
    onChange={(_, newValue) => {
      onChange(newValue || '');
      setInputValue(newValue || '');
    }}
    onInputChange={(_, value, reason) => {
      if (reason === 'input') {
        const filtered = markalar.filter(marka =>
          marka.isim.toLocaleLowerCase('tr-TR').includes(value.toLocaleLowerCase('tr-TR'))
        );

        // Eğer tek eşleşme varsa otomatik seç
        if (filtered.length === 1 && value.length > 0) {
          onChange(filtered[0].isim);
          setInputValue(filtered[0].isim); // Input'u tamamlanmış haliyle set et
        } else if (filtered.length > 1) {
          // Birden fazla eşleşme varsa input'u kullanıcının yazdığı ile güncel tut
          setInputValue(value);
        }
        // filtered.length === 0 durumunda hiçbir şey yapma
      } else if (reason === 'reset') {
        setInputValue(value);
      }
    }}
    autoHighlight
    selectOnFocus
    clearOnBlur={false}
    handleHomeEndKeys={false}
    renderInput={(params) => (
      <TextField
        {...params}
        name="marka"
        required
        label="Marka"
        fullWidth
        placeholder="Marka ara ve seç..."
        error={!value}
        helperText={!value ? 'Listeden bir marka seçmelisiniz' : ''}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const popup = document.querySelector('[role="listbox"]');
            if (popup) {
              const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
              if (highlighted) {
                const text = highlighted.textContent;
                if (text && markalar.some(m => m.isim === text)) {
                  onChange(text);
                  setInputValue(text);
                }
              }
            }
            setTimeout(() => {
              const modelInput = document.querySelector('input[name="model"]') as HTMLInputElement;
              if (modelInput) {
                modelInput.focus();
              }
            }, 100);
          }
        }}
      />
    )}
  />
);

export default AtolyeMarkaAutocomplete;
