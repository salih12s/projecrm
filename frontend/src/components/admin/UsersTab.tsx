import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  PersonAdd,
  Block,
  CheckCircle,
  Delete,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import UserRecordsCollapse from './UserRecordsCollapse';
import { UserRecord, AtolyeRecord } from './adminPanelTypes';

interface User {
  id: number;
  username: string;
  created_at: string;
  is_active: boolean;
  total_records: number;
}

interface Props {
  users: User[];
  expandedUser: string | null;
  userRecords: { [key: string]: UserRecord[] };
  userAtolyeRecords: { [key: string]: AtolyeRecord[] };
  onOpenCreateDialog: () => void;
  onViewRecords: (username: string) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  onDelete: (id: number, username: string) => void;
}

const UsersTab: React.FC<Props> = ({
  users,
  expandedUser,
  userRecords,
  userAtolyeRecords,
  onOpenCreateDialog,
  onViewRecords,
  onToggleStatus,
  onDelete,
}) => (
  <>
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between',
      alignItems: { xs: 'stretch', sm: 'center' },
      mb: 3,
      gap: 2
    }}>
      <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
        Kullanıcı Yönetimi
      </Typography>
      <Button
        variant="contained"
        startIcon={<PersonAdd />}
        onClick={onOpenCreateDialog}
        fullWidth
        sx={{ maxWidth: { sm: 200 } }}
      >
        Yeni Kullanıcı Ekle
      </Button>
    </Box>

    <Alert severity="info" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
      Sistemdeki tüm kullanıcıları görüntüleyebilir, aktif/pasif yapabilir ve kayıtlarını inceleyebilirsiniz.
    </Alert>

    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: '#0D3282' }}>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Kullanıcı Adı</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Kayıt Tarihi</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Toplam Kayıt</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Durum</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 600 }}>İşlemler</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <React.Fragment key={user.id}>
              <TableRow hover>
                <TableCell>
                  <Typography fontWeight={500}>{user.username}</Typography>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleString('tr-TR')}
                </TableCell>
                <TableCell>
                  <Chip label={user.total_records} color="primary" size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? 'Aktif' : 'Pasif'}
                    color={user.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Kayıtları Görüntüle">
                      <IconButton
                        size="small"
                        onClick={() => onViewRecords(user.username)}
                        color="info"
                      >
                        {expandedUser === user.username ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={user.is_active ? 'Pasif Yap' : 'Aktif Yap'}>
                      <IconButton
                        size="small"
                        onClick={() => onToggleStatus(user.id, user.is_active)}
                        color={user.is_active ? 'warning' : 'success'}
                      >
                        {user.is_active ? <Block /> : <CheckCircle />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton
                        size="small"
                        onClick={() => onDelete(user.id, user.username)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>

              {/* Kullanıcı Kayıtları */}
              <TableRow>
                <TableCell colSpan={5} sx={{ p: 0 }}>
                  <UserRecordsCollapse
                    open={expandedUser === user.username}
                    username={user.username}
                    records={userRecords[user.username]}
                    atolyeRecords={userAtolyeRecords[user.username]}
                  />
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </>
);

export default UsersTab;
