import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { Bayi } from '../../../types';

interface Props {
  bayiler: Bayi[];
  value: string;
  inputValue: string;
  setInputValue: (v: string) => void;
  onChange: (isim: string) => void;
}

const AtolyeBayiAutocomplete: React.FC<Props> = ({ bayiler, value, inputValue, setInputValue, onChange }) => (
  <Autocomplete
    options={bayiler.map((b) => b.isim)}
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
        setInputValue(value);
        const filtered = bayiler.filter(bayi =>
          bayi.isim.toLocaleLowerCase('tr-TR').includes(value.toLocaleLowerCase('tr-TR'))
        );

        if (filtered.length === 1 && value.length > 0) {
          onChange(filtered[0].isim);
          setInputValue(filtered[0].isim);
        }
      } else if (reason === 'reset') {
        setInputValue(value);
      } else if (reason === 'clear') {
        onChange('');
        setInputValue('');
      }
    }}
    autoHighlight
    selectOnFocus
    clearOnBlur={false}
    handleHomeEndKeys={false}
    renderInput={(params) => (
      <TextField
        {...params}
        name="bayi_adi"
        label="Bayi Adı"
        fullWidth
        placeholder="Bayi ara ve seç..."
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const popup = document.querySelector('[role="listbox"]');
            if (popup) {
              const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
              if (highlighted) {
                const text = highlighted.textContent;
                if (text && bayiler.some(b => b.isim === text)) {
                  onChange(text);
                  setInputValue(text);
                }
              }
            }
            setTimeout(() => {
              const musteriInput = document.querySelector('input[name="musteri_ad_soyad"]') as HTMLInputElement;
              if (musteriInput) {
                musteriInput.focus();
              }
            }, 100);
          }
        }}
      />
    )}
  />
);

export default AtolyeBayiAutocomplete;
