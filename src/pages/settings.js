// SpliBi - Settings Page
import { getSetting, setSetting } from '../db.js';
import { showToast } from '../utils/ui.js';

export async function renderSettings(container) {
    const defaultTip = await getSetting('defaultTip', 0);
    const defaultTax = await getSetting('defaultTax', 10);
    const defaultService = await getSetting('defaultService', 5);

    container.innerHTML = `
    <div class="mb-xl">
      <h2 style="font-size: 1.15rem; font-weight: 700;">Pengaturan</h2>
      <p class="text-xs text-secondary mt-sm">Atur preferensi aplikasi</p>
    </div>

    <!-- Defaults -->
    <div class="card mb-lg">
      <div class="section-title text-sm mb-md">Default Persentase</div>

      <div class="flex items-center justify-between mb-md">
        <div>
          <div class="text-sm font-medium">Pajak (PB1)</div>
          <div class="text-xs text-secondary">Pajak restoran default</div>
        </div>
        <div class="input-row" style="width: 90px;">
          <input type="number" class="form-input" id="defaultTax" value="${defaultTax}" style="padding: 6px 10px; font-size: 0.85rem; text-align: right;" min="0" max="100" step="0.5" />
          <span class="input-prefix">%</span>
        </div>
      </div>

      <div class="flex items-center justify-between mb-md">
        <div>
          <div class="text-sm font-medium">Service</div>
          <div class="text-xs text-secondary">Biaya service default</div>
        </div>
        <div class="input-row" style="width: 90px;">
          <input type="number" class="form-input" id="defaultService" value="${defaultService}" style="padding: 6px 10px; font-size: 0.85rem; text-align: right;" min="0" max="100" step="0.5" />
          <span class="input-prefix">%</span>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-medium">Tip</div>
          <div class="text-xs text-secondary">Tip default</div>
        </div>
        <div class="input-row" style="width: 90px;">
          <input type="number" class="form-input" id="defaultTip" value="${defaultTip}" style="padding: 6px 10px; font-size: 0.85rem; text-align: right;" min="0" max="100" step="0.5" />
          <span class="input-prefix">%</span>
        </div>
      </div>
    </div>

    <!-- Save -->
    <button class="btn btn-primary btn-block mb-lg" id="saveSettingsBtn">Simpan Pengaturan</button>

    <!-- Data Management -->
    <div class="card mb-lg">
      <div class="section-title text-sm mb-md">Data</div>

      <button class="btn btn-outline btn-block mb-sm" id="exportBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        Export Data (JSON)
      </button>

      <button class="btn btn-outline btn-block mb-sm" id="importBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        Import Data (JSON)
      </button>
      <input type="file" id="importFileInput" accept=".json" style="display: none;" />

      <div class="divider"></div>

      <button class="btn btn-danger btn-block" id="clearDataBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        Hapus Semua Data
      </button>
    </div>

    <!-- About -->
    <div class="card mb-lg">
      <div class="section-title text-sm mb-md">Tentang</div>
      <div class="text-sm text-secondary">
        <p><strong>SpliBi</strong> — Split Bill Bareng</p>
        <p class="mt-sm">Versi 1.0.0</p>
        <p class="mt-sm">Semua data disimpan secara lokal di perangkatmu. Tidak ada data yang dikirim ke server.</p>
      </div>
    </div>

    <!-- Coming Soon -->
    <div class="card" style="opacity: 0.6;">
      <div class="flex items-center gap-sm mb-sm">
        <span class="badge badge-warning">Segera Hadir</span>
      </div>
      <div class="text-sm text-secondary">
        <p>🔍 Deteksi otomatis pajak & diskon dari struk</p>
        <p class="mt-sm">🌐 Multi-bahasa</p>
        <p class="mt-sm">📊 Statistik pengeluaran</p>
      </div>
    </div>
  `;

    // Save settings
    container.querySelector('#saveSettingsBtn').addEventListener('click', async () => {
        await setSetting('defaultTax', parseFloat(container.querySelector('#defaultTax').value) || 0);
        await setSetting('defaultService', parseFloat(container.querySelector('#defaultService').value) || 0);
        await setSetting('defaultTip', parseFloat(container.querySelector('#defaultTip').value) || 0);
        showToast('Pengaturan disimpan! ✓');
    });

    // Export
    container.querySelector('#exportBtn').addEventListener('click', async () => {
        const { getAllReceipts, getAllGroups } = await import('../db.js');
        const data = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            receipts: await getAllReceipts(),
            groups: await getAllGroups()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `splibi_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data berhasil di-export!');
    });

    // Import
    container.querySelector('#importBtn').addEventListener('click', () => {
        container.querySelector('#importFileInput').click();
    });

    container.querySelector('#importFileInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.receipts && !data.groups) {
                showToast('Format file tidak valid', 'error');
                return;
            }

            const { saveReceipt, saveGroup } = await import('../db.js');

            if (data.receipts) {
                for (const r of data.receipts) {
                    delete r.id; // Let auto-increment assign new IDs
                    await saveReceipt(r);
                }
            }

            if (data.groups) {
                for (const g of data.groups) {
                    delete g.id;
                    await saveGroup(g);
                }
            }

            showToast(`Berhasil import ${data.receipts?.length || 0} struk & ${data.groups?.length || 0} grup!`);
        } catch (err) {
            showToast('Gagal membaca file', 'error');
        }
    });

    // Clear data
    container.querySelector('#clearDataBtn').addEventListener('click', async () => {
        const { confirmDialog } = await import('../utils/ui.js');
        const confirmed = await confirmDialog('Semua struk dan grup akan dihapus permanen. Lanjutkan?');
        if (confirmed) {
            const { getDB } = await import('../db.js');
            const db = await getDB();
            const tx = db.transaction(['receipts', 'groups'], 'readwrite');
            await Promise.all([
                tx.objectStore('receipts').clear(),
                tx.objectStore('groups').clear(),
                tx.done
            ]);
            showToast('Semua data dihapus');
            renderSettings(container);
        }
    });
}
