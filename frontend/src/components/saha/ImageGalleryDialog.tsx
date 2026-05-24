import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
} from '@mui/material';
import { ZoomIn, ZoomOut, Close } from '@mui/icons-material';

interface Props {
  images: string[];
  onClose: () => void;
}

const ImageGalleryDialog: React.FC<Props> = ({ images, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryZoom, setGalleryZoom] = useState(1);
  const [galleryPan, setGalleryPan] = useState({ x: 0, y: 0 });
  const [galleryPanning, setGalleryPanning] = useState(false);
  const [galleryPanStart, setGalleryPanStart] = useState({ x: 0, y: 0 });
  const [lastTouchDist, setLastTouchDist] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (images.length > 0) {
      setCurrentImageIndex(0);
      setGalleryZoom(1);
      setGalleryPan({ x: 0, y: 0 });
    }
  }, [images]);

  const handleClose = () => {
    setGalleryZoom(1);
    setGalleryPan({ x: 0, y: 0 });
    onClose();
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
  const compactColor = isMobile ? 'white' : 'inherit';

  return (
    <Dialog
      open={images.length > 0}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: isMobile ? { bgcolor: 'rgba(0,0,0,0.95)' } : {} }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: compactColor,
          p: { xs: 1, sm: 2 },
        }}
      >
        <Typography variant="body1" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
          Fotoğraflar {images.length > 1 ? `(${currentImageIndex + 1}/${images.length})` : ''}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0, alignItems: 'center' }}>
          <IconButton
            size="small"
            onClick={() => setGalleryZoom((prev) => Math.max(1, prev - 0.25))}
            disabled={galleryZoom <= 1}
            sx={{ color: compactColor }}
          >
            <ZoomOut fontSize="small" />
          </IconButton>
          <Typography sx={{ fontSize: '0.75rem', minWidth: 35, textAlign: 'center' }}>
            {Math.round(galleryZoom * 100)}%
          </Typography>
          <IconButton
            size="small"
            onClick={() => setGalleryZoom((prev) => Math.min(5, prev + 0.25))}
            disabled={galleryZoom >= 5}
            sx={{ color: compactColor }}
          >
            <ZoomIn fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleClose} sx={{ color: compactColor }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ overflow: 'hidden', p: { xs: 0.5, sm: 1 } }}>
        {images.length > 0 && (
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                overflow: 'hidden',
                maxHeight: isMobile ? 'calc(100vh - 180px)' : '70vh',
                minHeight: { xs: '50vh', sm: 'auto' },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: galleryZoom > 1 ? (galleryPanning ? 'grabbing' : 'grab') : 'zoom-in',
                userSelect: 'none',
                touchAction: 'none',
              }}
              onWheel={(e) => {
                e.preventDefault();
                if (e.deltaY < 0) {
                  setGalleryZoom((prev) => Math.min(5, prev + 0.25));
                } else {
                  setGalleryZoom((prev) => {
                    const nz = Math.max(1, prev - 0.25);
                    if (nz === 1) setGalleryPan({ x: 0, y: 0 });
                    return nz;
                  });
                }
              }}
              onClick={() => {
                if (!galleryPanning) {
                  if (galleryZoom === 1) {
                    setGalleryZoom(2);
                  } else {
                    setGalleryZoom(1);
                    setGalleryPan({ x: 0, y: 0 });
                  }
                }
              }}
              onMouseDown={(e) => {
                if (galleryZoom > 1) {
                  setGalleryPanning(true);
                  setGalleryPanStart({ x: e.clientX - galleryPan.x, y: e.clientY - galleryPan.y });
                }
              }}
              onMouseMove={(e) => {
                if (galleryPanning && galleryZoom > 1) {
                  setGalleryPan({ x: e.clientX - galleryPanStart.x, y: e.clientY - galleryPanStart.y });
                }
              }}
              onMouseUp={() => setGalleryPanning(false)}
              onMouseLeave={() => setGalleryPanning(false)}
              onTouchStart={(e) => {
                if (e.touches.length === 2) {
                  e.preventDefault();
                  const dx = e.touches[0].clientX - e.touches[1].clientX;
                  const dy = e.touches[0].clientY - e.touches[1].clientY;
                  setLastTouchDist(Math.hypot(dx, dy));
                  setLastTouchCenter({
                    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                    y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                  });
                } else if (e.touches.length === 1 && galleryZoom > 1) {
                  setGalleryPanning(true);
                  setGalleryPanStart({ x: e.touches[0].clientX - galleryPan.x, y: e.touches[0].clientY - galleryPan.y });
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 2 && lastTouchDist !== null) {
                  e.preventDefault();
                  const dx = e.touches[0].clientX - e.touches[1].clientX;
                  const dy = e.touches[0].clientY - e.touches[1].clientY;
                  const newDist = Math.hypot(dx, dy);
                  const scale = newDist / lastTouchDist;
                  setGalleryZoom((prev) => {
                    const nz = Math.min(5, Math.max(1, prev * scale));
                    if (nz === 1) setGalleryPan({ x: 0, y: 0 });
                    return nz;
                  });
                  setLastTouchDist(newDist);
                  if (lastTouchCenter) {
                    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                    setGalleryPan((prev) => ({
                      x: prev.x + (cx - lastTouchCenter.x),
                      y: prev.y + (cy - lastTouchCenter.y),
                    }));
                    setLastTouchCenter({ x: cx, y: cy });
                  }
                } else if (e.touches.length === 1 && galleryPanning && galleryZoom > 1) {
                  setGalleryPan({ x: e.touches[0].clientX - galleryPanStart.x, y: e.touches[0].clientY - galleryPanStart.y });
                }
              }}
              onTouchEnd={(e) => {
                if (e.touches.length < 2) {
                  setLastTouchDist(null);
                  setLastTouchCenter(null);
                }
                if (e.touches.length === 0) setGalleryPanning(false);
              }}
            >
              <img
                src={images[currentImageIndex]}
                alt="Preview"
                draggable={false}
                style={{
                  transform: `scale(${galleryZoom}) translate(${galleryPan.x / galleryZoom}px, ${galleryPan.y / galleryZoom}px)`,
                  transition: galleryPanning ? 'none' : 'transform 0.2s ease',
                  maxWidth: '100%',
                  maxHeight: isMobile ? 'calc(100vh - 180px)' : '70vh',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  imageRendering: 'auto',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              />
            </Box>
            {images.length > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1, sm: 2 }, mt: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    color: compactColor,
                    borderColor: isMobile ? 'rgba(255,255,255,0.5)' : 'inherit',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                    setGalleryZoom(1);
                    setGalleryPan({ x: 0, y: 0 });
                  }}
                >
                  ← Önceki
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    color: compactColor,
                    borderColor: isMobile ? 'rgba(255,255,255,0.5)' : 'inherit',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev + 1) % images.length);
                    setGalleryZoom(1);
                    setGalleryPan({ x: 0, y: 0 });
                  }}
                >
                  Sonraki →
                </Button>
              </Box>
            )}
            {/* Thumbnails */}
            {images.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1.5, flexWrap: 'wrap', pb: 1 }}>
                {images.map((img, idx) => (
                  <Box
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                      setGalleryZoom(1);
                      setGalleryPan({ x: 0, y: 0 });
                    }}
                    sx={{
                      width: { xs: 45, sm: 60 },
                      height: { xs: 45, sm: 60 },
                      cursor: 'pointer',
                      border: idx === currentImageIndex ? '3px solid #1976d2' : '1px solid rgba(255,255,255,0.3)',
                      borderRadius: 1,
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={img}
                      alt={`Thumb ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageGalleryDialog;
