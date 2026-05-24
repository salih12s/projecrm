import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Engineering,
  People,
} from '@mui/icons-material';
import { adminService } from '../../services/admin.service';
import { sahaService } from '../../services/saha.service';
import { useSnackbar } from '../../context/SnackbarContext';
import { SahaElemani, SahaKayit } from '../../types';
import CreateUserDialog from './dialog/CreateUserDialog';
import CreateSahaElemaniDialog from './dialog/CreateSahaElemaniDialog';
import UsersTab from './UsersTab';
import SahaElemanlariTab from './SahaElemanlariTab';
import { UserRecord, AtolyeRecord } from './adminPanelTypes';

interface User {
  id: number;
  username: string;
  created_at: string;
  is_active: boolean;
  total_records: number;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userRecords, setUserRecords] = useState<{ [key: string]: UserRecord[] }>({});
  const [userAtolyeRecords, setUserAtolyeRecords] = useState<{ [key: string]: AtolyeRecord[] }>({});
  const { showSnackbar } = useSnackbar();
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Saha elemanları state
  const [sahaElemanlari, setSahaElemanlari] = useState<SahaElemani[]>([]);
  const [sahaLoading, setSahaLoading] = useState(false);
  const [openSahaDialog, setOpenSahaDialog] = useState(false);
  const [newSahaUsername, setNewSahaUsername] = useState('');
  const [newSahaPassword, setNewSahaPassword] = useState('');
  const [newSahaAdSoyad, setNewSahaAdSoyad] = useState('');
  const [expandedSahaUser, setExpandedSahaUser] = useState<string | null>(null);
  const [sahaUserRecords, setSahaUserRecords] = useState<{ [key: string]: SahaKayit[] }>({});

  useEffect(() => {
    loadUsers();
    loadSahaElemanlari();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (error: any) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      showSnackbar('Kullanıcılar yüklenirken hata oluştu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSahaElemanlari = async () => {
    try {
      setSahaLoading(true);
      const data = await sahaService.getSahaElemanlari();
      setSahaElemanlari(data);
    } catch (error: any) {
      console.error('Saha elemanları yüklenirken hata:', error);
    } finally {
      setSahaLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      showSnackbar('Kullanıcı adı ve şifre boş olamaz!', 'warning');
      return;
    }

    try {
      await adminService.createUser(newUsername, newPassword);
      showSnackbar('Kullanıcı başarıyla oluşturuldu!', 'success');
      setOpenCreateDialog(false);
      setNewUsername('');
      setNewPassword('');
      loadUsers();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Kullanıcı oluşturulurken hata oluştu!';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleToggleUserStatus = async (id: number, currentStatus: boolean) => {
    try {
      await adminService.toggleUserStatus(id);
      showSnackbar(
        currentStatus ? 'Kullanıcı pasif edildi!' : 'Kullanıcı aktif edildi!',
        'success'
      );
      loadUsers();
    } catch (error: any) {
      showSnackbar('Durum değiştirilirken hata oluştu!', 'error');
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (window.confirm(`${username} kullanıcısını silmek istediğinizden emin misiniz?`)) {
      try {
        await adminService.deleteUser(id);
        showSnackbar('Kullanıcı silindi!', 'success');
        loadUsers();
      } catch (error: any) {
        showSnackbar('Kullanıcı silinirken hata oluştu!', 'error');
      }
    }
  };

  const handleViewRecords = async (username: string) => {
    if (expandedUser === username) {
      setExpandedUser(null);
      return;
    }

    try {
      const [records, atolyeRecords] = await Promise.all([
        adminService.getUserRecords(username),
        adminService.getUserAtolyeRecords(username)
      ]);
      setUserRecords({ ...userRecords, [username]: records });
      setUserAtolyeRecords({ ...userAtolyeRecords, [username]: atolyeRecords });
      setExpandedUser(username);
    } catch (error: any) {
      showSnackbar('Kayıtlar yüklenirken hata oluştu!', 'error');
    }
  };

  // Saha Elemanı Fonksiyonları
  const handleCreateSahaElemani = async () => {
    if (!newSahaUsername || !newSahaPassword) {
      showSnackbar('Kullanıcı adı ve şifre boş olamaz!', 'warning');
      return;
    }

    try {
      await sahaService.createSahaElemani(newSahaUsername, newSahaPassword, newSahaAdSoyad);
      showSnackbar('Saha elemanı başarıyla oluşturuldu!', 'success');
      setOpenSahaDialog(false);
      setNewSahaUsername('');
      setNewSahaPassword('');
      setNewSahaAdSoyad('');
      loadSahaElemanlari();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Saha elemanı oluşturulurken hata oluştu!';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleToggleSahaStatus = async (id: number, currentStatus: boolean) => {
    try {
      await sahaService.toggleSahaElemaniStatus(id);
      showSnackbar(
        currentStatus ? 'Saha elemanı pasif edildi!' : 'Saha elemanı aktif edildi!',
        'success'
      );
      loadSahaElemanlari();
    } catch (error: any) {
      showSnackbar('Durum değiştirilirken hata oluştu!', 'error');
    }
  };

  const handleDeleteSahaElemani = async (id: number, username: string) => {
    if (window.confirm(`${username} saha elemanını silmek istediğinizden emin misiniz?`)) {
      try {
        await sahaService.deleteSahaElemani(id);
        showSnackbar('Saha elemanı silindi!', 'success');
        loadSahaElemanlari();
      } catch (error: any) {
        showSnackbar('Saha elemanı silinirken hata oluştu!', 'error');
      }
    }
  };

  const handleViewSahaRecords = async (username: string) => {
    if (expandedSahaUser === username) {
      setExpandedSahaUser(null);
      return;
    }

    try {
      const records = await sahaService.getUserKayitlar(username);
      setSahaUserRecords({ ...sahaUserRecords, [username]: records });
      setExpandedSahaUser(username);
    } catch (error: any) {
      showSnackbar('Kayıtlar yüklenirken hata oluştu!', 'error');
    }
  };

  if (loading) {
    return <Typography>Yükleniyor...</Typography>;
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<People />} iconPosition="start" label="Kullanıcılar" />
          <Tab icon={<Engineering />} iconPosition="start" label="Saha Elemanları" />
        </Tabs>
      </Paper>


      {/* Kullanıcılar Tab */}
      {activeTab === 0 && (
        <UsersTab
          users={users}
          expandedUser={expandedUser}
          userRecords={userRecords}
          userAtolyeRecords={userAtolyeRecords}
          onOpenCreateDialog={() => setOpenCreateDialog(true)}
          onViewRecords={handleViewRecords}
          onToggleStatus={handleToggleUserStatus}
          onDelete={handleDeleteUser}
        />
      )}

      {/* Saha Elemanları Tab */}
      {activeTab === 1 && (
        <SahaElemanlariTab
          sahaElemanlari={sahaElemanlari}
          sahaLoading={sahaLoading}
          expandedSahaUser={expandedSahaUser}
          sahaUserRecords={sahaUserRecords}
          onOpenCreateDialog={() => setOpenSahaDialog(true)}
          onViewRecords={handleViewSahaRecords}
          onToggleStatus={handleToggleSahaStatus}
          onDelete={handleDeleteSahaElemani}
        />
      )}

      {/* Kullanıcı Oluşturma Dialog */}
      <CreateUserDialog
        open={openCreateDialog}
        username={newUsername}
        password={newPassword}
        onUsernameChange={setNewUsername}
        onPasswordChange={setNewPassword}
        onClose={() => setOpenCreateDialog(false)}
        onSubmit={handleCreateUser}
      />

      {/* Saha Elemanı Oluşturma Dialog */}
      <CreateSahaElemaniDialog
        open={openSahaDialog}
        username={newSahaUsername}
        adSoyad={newSahaAdSoyad}
        password={newSahaPassword}
        onUsernameChange={setNewSahaUsername}
        onAdSoyadChange={setNewSahaAdSoyad}
        onPasswordChange={setNewSahaPassword}
        onClose={() => setOpenSahaDialog(false)}
        onSubmit={handleCreateSahaElemani}
      />
    </Box>
  );
};

export default AdminPanel;
