import React from 'react';
import { Autocomplete, Grid, TextField } from '@mui/material';
import { Ilce } from '../../../services/location.service';

interface Props {
  ilceler: Ilce[];
  value: string;
  inputValue: string;
  setInputValue: (val: string) => void;
  onChange: (isim: string, ilceId: number | null) => void;
}

const IlceAutocomplete: React.FC<Props> = ({ ilceler, value, inputValue, setInputValue, onChange }) => (
  <Grid item xs={12} sm={6}>
    <Autocomplete
      size="small"
      options={ilceler}
      getOptionLabel={(option) => option.isim}
      value={ilceler.find(i => i.isim === value) || null}
      inputValue={inputValue}
      filterOptions={(options, state) => {
        if (!state.inputValue) return options;
        const filtered = options.filter(option =>
          option.isim.toLocaleLowerCase('tr-TR').includes(state.inputValue.toLocaleLowerCase('tr-TR'))
        );
        return filtered;
      }}
      onChange={(_, newValue) => {
        onChange(newValue?.isim || '', newValue?.ilce_id || null);
        setInputValue(newValue?.isim || '');
      }}
      onInputChange={(_, val, reason) => {
        if (reason === 'input') {
          const filtered = ilceler.filter(ilce =>
            ilce.isim.toLocaleLowerCase('tr-TR').includes(val.toLocaleLowerCase('tr-TR'))
          );
          if (filtered.length === 1 && val.length > 0) {
            onChange(filtered[0].isim, filtered[0].ilce_id);
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
      renderInput={(params) => (
        <TextField
          {...params}
          name="ilce"
          required
          label="İlçe"
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const popup = document.querySelector('[role="listbox"]');
              if (popup) {
                const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
                if (highlighted) {
                  const text = highlighted.textContent;
                  const found = ilceler.find(i => i.isim === text);
                  if (found) {
                    onChange(found.isim, found.ilce_id);
                  }
                }
              }
              setTimeout(() => {
                const mahalleInput = document.querySelector('input[name="mahalle"]') as HTMLInputElement;
                if (mahalleInput) {
                  mahalleInput.focus();
                }
              }, 100);
            }
          }}
        />
      )}
    />
  </Grid>
);

export default IlceAutocomplete;
