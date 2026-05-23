import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Autocomplete,
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  FormGroup,
  MenuItem,
} from '@mui/material';
import { IslemUpdateDto } from '../../../types';

interface Montaj { id: number; isim: string }
interface Aksesuar { id: number; isim: string }
interface Teknisyen { id: number; isim: string }

interface Props {
  open: boolean;
  isMobile: boolean;
  montajlar: Montaj[];
  aksesuarlar: Aksesuar[];
  teknisyenler: Teknisyen[];
  selectedMontajlar: number[];
  selectedAksesuarlar: number[];
  formData: IslemUpdateDto;
  teknisyenInputValue: string;
  setFormData: (data: IslemUpdateDto) => void;
  setTeknisyenInputValue: (v: string) => void;
  handleMontajChange: (id: number) => void;
  handleAksesuarChange: (id: number) => void;
  handleChange: (
    field: keyof IslemUpdateDto
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const TamamlaConfirmDialog: React.FC<Props> = ({
  open,
  isMobile,
  montajlar,
  aksesuarlar,
  teknisyenler,
  selectedMontajlar,
  selectedAksesuarlar,
  formData,
  teknisyenInputValue,
  setFormData,
  setTeknisyenInputValue,
  handleMontajChange,
  handleAksesuarChange,
  handleChange,
  onCancel,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        // Backdrop'a tıklamayı engelle - sadece İptal butonuyla kapanabilir
        if (reason !== 'backdropClick') {
          onCancel();
        }
      }}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown={false}
    >
      <DialogTitle sx={{ bgcolor: 'success.light', color: 'success.contrastText', py: 0.75, px: 2, fontSize: '1rem', fontWeight: 600 }}>
        İşlemi Tamamla
      </DialogTitle>
      <DialogContent sx={{ py: 1, px: 2, maxHeight: '75vh', overflowY: 'auto' }}>
        <Grid container spacing={1}>
          {/* Montaj ve Aksesuar Checkboxları - Daha kompakt */}
          <Grid item xs={12}>
            <Box sx={{ p: 0.5, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f9f9f9' }}>
              <Grid container spacing={0.5}>
                {/* Montajlar */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 'bold', color: '#0D3282', display: 'block' }}>
                    Montaj
                  </Typography>
                  {montajlar.length > 0 ? (
                    <FormGroup>
                      {montajlar.map((montaj) => (
                        <FormControlLabel
                          key={montaj.id}
                          control={
                            <Checkbox
                              size="small"
                              checked={selectedMontajlar.includes(montaj.id)}
                              onChange={() => handleMontajChange(montaj.id)}
                              sx={{
                                color: '#0D3282',
                                '&.Mui-checked': { color: '#0D3282' },
                                py: 0.25,
                              }}
                            />
                          }
                          label={<Typography variant="body2">{montaj.isim}</Typography>}
                          sx={{ my: 0 }}
                        />
                      ))}
                    </FormGroup>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Montaj listesi boş
                    </Typography>
                  )}
                </Grid>

                {/* Aksesuarlar */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 'bold', color: '#0D8220', display: 'block' }}>
                    Aksesuarlar
                  </Typography>
                  {aksesuarlar.length > 0 ? (
                    <FormGroup>
                      {aksesuarlar.map((aksesuar) => (
                        <FormControlLabel
                          key={aksesuar.id}
                          control={
                            <Checkbox
                              size="small"
                              checked={selectedAksesuarlar.includes(aksesuar.id)}
                              onChange={() => handleAksesuarChange(aksesuar.id)}
                              sx={{
                                color: '#0D8220',
                                '&.Mui-checked': { color: '#0D8220' },
                                py: 0.25,
                              }}
                            />
                          }
                          label={<Typography variant="body2">{aksesuar.isim}</Typography>}
                          sx={{ my: 0 }}
                        />
                      ))}
                    </FormGroup>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Aksesuar listesi boş
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Teknisyen İsmi - Zorunlu */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              size="small"
              freeSolo
              options={teknisyenler.map((t) => t.isim)}
              value={formData.teknisyen_ismi || ''}
              onChange={(_, newValue) => {
                setFormData({ ...formData, teknisyen_ismi: newValue || '' });
                setTeknisyenInputValue(newValue || '');
              }}
              inputValue={teknisyenInputValue}
              onInputChange={(_, newInputValue, reason) => {
                // Kullanıcı yazarken filtrelenen seçenekleri kontrol et
                if (reason === 'input') {
                  const filtered = teknisyenler.filter((tek) =>
                    tek.isim.toLocaleLowerCase('tr-TR').includes(newInputValue.toLocaleLowerCase('tr-TR'))
                  );

                  // Eğer tek eşleşme varsa otomatik seç ve inputValue'yu tamamla
                  if (filtered.length === 1 && newInputValue.length > 0) {
                    setFormData({ ...formData, teknisyen_ismi: filtered[0].isim });
                    setTeknisyenInputValue(filtered[0].isim); // Input'u tamamlanmış haliyle set et
                  } else if (filtered.length > 1) {
                    // Birden fazla eşleşme varsa input'u kullanıcının yazdığı ile güncel tut
                    setTeknisyenInputValue(newInputValue);
                    setFormData({ ...formData, teknisyen_ismi: newInputValue });
                  }
                  // filtered.length === 0 durumunda hiçbir şey yapma (freeSolo için yeni isim yazılabilir ama yazmayı durdur)
                } else if (reason === 'reset') {
                  setTeknisyenInputValue(newInputValue);
                  setFormData({ ...formData, teknisyen_ismi: newInputValue });
                } else {
                  // Diğer durumlarda inputValue'yu güncelle
                  setTeknisyenInputValue(newInputValue);
                }
              }}
              autoHighlight
              selectOnFocus
              clearOnBlur={false}
              handleHomeEndKeys={false}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required={formData.is_durumu !== 'iptal'}
                  fullWidth
                  size="small"
                  label="Teknisyen İsmi"
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      const popup = document.querySelector('[role="listbox"]');
                      if (popup) {
                        const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
                        if (highlighted) {
                          e.preventDefault();
                          const text = highlighted.textContent;
                          if (text) {
                            setFormData({ ...formData, teknisyen_ismi: text });
                            setTeknisyenInputValue(text);
                            setTimeout(() => {
                              (e.target as HTMLElement).blur();
                            }, 10);
                          }
                        }
                      }
                    }
                  }}
                />
              )}
            />
          </Grid>

          {/* Tutar */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Tutar"
              type="number"
              value={formData.tutar}
              onChange={handleChange('tutar')}
              onFocus={(e) => e.target.select()}
              InputProps={{
                endAdornment: 'TL',
              }}
            />
          </Grid>

          {/* Yapılan İşlem - İptal değilse zorunlu */}
          <Grid item xs={12}>
            <TextField
              required={formData.is_durumu !== 'iptal'}
              fullWidth
              size="small"
              multiline
              rows={1}
              label="Yapılan İşlem"
              value={formData.yapilan_islem}
              onChange={handleChange('yapilan_islem')}
            />
          </Grid>

          {/* İş Durumu - En altta */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="İş Durumu"
              value={formData.is_durumu}
              onChange={handleChange('is_durumu')}
            >
              <MenuItem value="acik">Açık</MenuItem>
              <MenuItem value="parca_bekliyor">Parça Bekliyor</MenuItem>
              <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
              <MenuItem value="iptal">İptal</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1 }}>
        <Button onClick={onCancel} variant="outlined" size="small">
          İptal
        </Button>
        <Button onClick={onConfirm} variant="contained" color="success" size="small" autoFocus>
          Tamamla
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TamamlaConfirmDialog;
