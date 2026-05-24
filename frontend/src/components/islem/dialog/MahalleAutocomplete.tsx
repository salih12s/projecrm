import React from 'react';
import { Autocomplete, Grid, TextField } from '@mui/material';
import { Mahalle } from '../../../services/location.service';

interface Props {
  mahalleler: Mahalle[];
  selectedIlceId: number | null;
  value: string;
  inputValue: string;
  setInputValue: (val: string) => void;
  onChange: (isim: string) => void;
  disabled: boolean;
}

const MahalleAutocomplete: React.FC<Props> = ({
  mahalleler, selectedIlceId, value, inputValue, setInputValue, onChange, disabled,
}) => (
  <Grid item xs={12} sm={6}>
    <Autocomplete
      key={selectedIlceId || 'no-ilce'}
      size="small"
      options={mahalleler}
      getOptionLabel={(option) => option.isim}
      value={mahalleler.find(m => m.isim === value) || null}
      inputValue={inputValue}
      filterOptions={(options, state) => {
        if (!state.inputValue) return options;
        const filtered = options.filter(option =>
          option.isim.toLocaleLowerCase('tr-TR').includes(state.inputValue.toLocaleLowerCase('tr-TR'))
        );
        return filtered;
      }}
      onChange={(_, newValue) => {
        onChange(newValue?.isim || '');
        setInputValue(newValue?.isim || '');
      }}
      onInputChange={(_, val, reason) => {
        if (reason === 'input') {
          const filtered = mahalleler.filter(mahalle =>
            mahalle.isim.toLocaleLowerCase('tr-TR').includes(val.toLocaleLowerCase('tr-TR'))
          );
          if (filtered.length === 1 && val.length > 0) {
            onChange(filtered[0].isim);
            setInputValue(filtered[0].isim);
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
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          name="mahalle"
          label="Mahalle"
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const popup = document.querySelector('[role="listbox"]');
              if (popup) {
                const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
                if (highlighted) {
                  const text = highlighted.textContent;
                  const found = mahalleler.find(m => m.isim === text);
                  if (found) {
                    onChange(found.isim);
                  }
                }
              }
              setTimeout(() => {
                const caddeInput = document.querySelector('input[name="cadde"]') as HTMLInputElement;
                if (caddeInput) {
                  caddeInput.focus();
                }
              }, 100);
            }
          }}
        />
      )}
    />
  </Grid>
);

export default MahalleAutocomplete;
