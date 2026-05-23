import React from 'react';
import {
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

export interface IslemTableLoadingStateProps {
  /** Görüntülenecek kolon kimlikleri (sıralı). */
  columnOrder: string[];
  /** id → label sözlüğü; eksikse id görüntülenir. */
  columnConfigs: Record<string, { label: string } | undefined>;
  /** Üretilecek skeleton satır sayısı. Varsayılan: 8. */
  rowCount?: number;
}

/**
 * IslemTable için skeleton loader. Davranış ve görsel sx prop'ları
 * legacy `IslemTable.tsx` içindeki `if (loading)` bloğu ile birebir aynıdır.
 */
const IslemTableLoadingState: React.FC<IslemTableLoadingStateProps> = ({
  columnOrder,
  columnConfigs,
  rowCount = 8,
}) => {
  return (
    <TableContainer component={Paper} elevation={3}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'primary.main' }}>
            <TableCell sx={{ color: 'white', py: 1 }}>Sıra</TableCell>
            {columnOrder.map((colId) => (
              <TableCell key={colId} sx={{ color: 'white', py: 1 }}>
                {columnConfigs[colId]?.label || colId}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {[...Array(rowCount)].map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton variant="text" width={40} /></TableCell>
              {columnOrder.map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton variant="text" width="80%" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default IslemTableLoadingState;
