import React from 'react';
import { Autocomplete, Grid, TextField } from '@mui/material';

interface MarkaOption {
  isim: string;
}

interface Props {
  markalar: MarkaOption[];
  value: string;
  inputValue: string;
  setInputValue: (val: string) => void;
  onChange: (val: string) => void;
  markaUyari: string;
  clearMarkaUyari: () => void;
}

const MarkaAutocomplete: React.FC<Props> = ({
  markalar, value, inputValue, setInputValue, onChange, markaUyari, clearMarkaUyari,
}) => (
  <Grid item xs={12} sm={6}>
    <Autocomplete
      size="small"
      options={markalar.map(m => m.isim)}
      value={value || null}
      inputValue={inputValue}
      filterOptions={(options, state) => {
        if (!state.inputValue) return options;
        const filtered = options.filter(option =>
          option.toLocaleLowerCase('tr-TR').includes(state.inputValue.toLocaleLowerCase('tr-TR'))
        );
        return filtered;
      }}
      onChange={(_, newValue) => {
        onChange(newValue || '');
        setInputValue(newValue || '');
        clearMarkaUyari();
      }}
      onInputChange={(_, val, reason) => {
        if (reason === 'input') {
          const filtered = markalar.filter(marka =>
            marka.isim.toLocaleLowerCase('tr-TR').includes(val.toLocaleLowerCase('tr-TR'))
          );
          if (filtered.length === 1 && val.length > 0) {
            onChange(filtered[0].isim);
            setInputValue(filtered[0].isim);
            clearMarkaUyari();
          } else if (filtered.length > 1) {
            setInputValue(val);
          }
        } else if (reason === 'reset') {
          setInputValue(val);
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
          fullWidth
          required
          size="small"
          label="Marka"
          placeholder="Marka ara ve seç..."
          error={!value}
          helperText={markaUyari || (!value ? 'Listeden bir marka seçmelisiniz' : '')}
          FormHelperTextProps={{
            sx: markaUyari ? { color: 'warning.main', fontWeight: 500 } : undefined
          }}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
              e.preventDefault();
              const popup = document.querySelector('[role="listbox"]');
              if (popup) {
                const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
                if (highlighted) {
                  const text = highlighted.textContent;
                  if (text && markalar.some(m => m.isim === text)) {
                    onChange(text);
                    clearMarkaUyari();
                  }
                }
              }
              setTimeout(() => {
                const firstCheckbox = document.querySelector('[data-checkbox="montaj"]') as HTMLElement;
                if (firstCheckbox) {
                  firstCheckbox.focus();
                }
              }, 100);
            }
          }}
        />
      )}
    />
  </Grid>
);

export default MarkaAutocomplete;
