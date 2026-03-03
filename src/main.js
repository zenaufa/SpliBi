// SpliBi - Main Entry Point
import './index.css';
import { router } from './router.js';
import { renderHome } from './pages/home.js';
import { renderAddReceipt } from './pages/add-receipt.js';
import { renderSplitBill } from './pages/split-bill.js';
import { renderHistory } from './pages/history.js';
import { renderGroups } from './pages/groups.js';
import { renderSettings } from './pages/settings.js';
import { renderOnboarding } from './pages/onboarding.js';

// Register routes
router.register('/onboarding', {
  title: 'Selamat Datang',
  render: renderOnboarding,
  hideNav: true,
  hideTopBar: true
});

router.register('/', {
  title: 'SpliBi',
  render: renderHome
});

router.register('/add', {
  title: 'Tambah Struk',
  render: renderAddReceipt,
  showBack: true
});

router.register('/split/:id', {
  title: 'Split Bill',
  render: renderSplitBill,
  showBack: true
});

router.register('/history', {
  title: 'Riwayat',
  render: renderHistory
});

router.register('/groups', {
  title: 'Grup',
  render: renderGroups
});

router.register('/settings', {
  title: 'Pengaturan',
  render: renderSettings
});

// Initialize
router.init();

// Set default hash if none
if (!window.location.hash) {
  window.location.hash = '#/';
}
