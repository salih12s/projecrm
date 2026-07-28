import React, { memo } from 'react';
import { TableCell, TableRow } from '@mui/material';
import { Islem } from '../../../types';
import { ColumnConfig } from './islemColumnConfigs';

interface IslemTableRowProps {
  islem: Islem;
  columnOrder: string[];
  columnConfigs: Record<string, ColumnConfig>;
  columnWidths: Record<string, number>;
  /**
   * Optimistic "yazdırıldı" değeri. Kullanıcı simgeye bastığı anda set edilir,
   * sunucudan gerçek kayıt gelince temizlenir. `undefined` ise kaydın kendi
   * değeri kullanılır.
   */
  yazdirildiOverride?: boolean;
}

/**
 * Tek bir işlem satırı.
 *
 * ⚡ Bu bileşenin var oluş sebebi `memo`: eskiden satırlar doğrudan
 * IslemTable içinde map ediliyordu, dolayısıyla tablodaki HERHANGİ bir state
 * değişimi (yazdırma dialogu açmak, müşteri geçmişi açmak, filtre kutusuna
 * yazmak) 150 satır × ~20 hücreyi yeniden render ediyordu — her hücrede yeni
 * bir `sx` nesnesi + Tooltip. Artık bir satır yalnızca kendi verisi
 * değiştiğinde render olur.
 */
const IslemTableRow: React.FC<IslemTableRowProps> = ({
  islem,
  columnOrder,
  columnConfigs,
  columnWidths,
  yazdirildiOverride,
}) => {
  const effectiveIslem =
    yazdirildiOverride === undefined ? islem : { ...islem, yazdirildi: yazdirildiOverride };

  return (
    <TableRow
      hover
      sx={{
        '&:hover': {
          backgroundColor: 'rgba(13, 50, 130, 0.04)',
        },
      }}
    >
      <TableCell
        sx={{
          fontWeight: 500,
          fontSize: '0.65rem',
          py: 0.1,
          px: 0.2,
          textAlign: 'center',
          width: columnWidths.sira,
          minWidth: columnWidths.sira,
          maxWidth: columnWidths.sira,
          borderRight: '1px solid rgba(224, 224, 224, 0.5)',
        }}
      >
        {islem.id}
      </TableCell>
      {columnOrder.map((columnId) => {
        const column = columnConfigs[columnId];
        const cell = column.render(effectiveIslem);
        const width = columnWidths[columnId];

        return React.cloneElement(cell as React.ReactElement, {
          key: columnId,
          sx: {
            ...(cell as React.ReactElement).props.sx,
            width,
            minWidth: width,
            maxWidth: width,
            borderRight: '1px solid rgba(224, 224, 224, 0.5)',
          },
        });
      })}
    </TableRow>
  );
};

export default memo(IslemTableRow);
