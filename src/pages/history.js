// SpliBi - History Page
import { getAllReceipts, deleteReceipt } from '../db.js';
import { formatIDR } from '../utils/calculator.js';
import { formatDate, showToast, confirmDialog, staggerDelay, avatarHTML } from '../utils/ui.js';

export async function renderHistory(container) {
    const receipts = await getAllReceipts();

    container.innerHTML = `
    <div class="mb-lg">
      <h2 style="font-size: 1.15rem; font-weight: 700;">Riwayat Struk</h2>
      <p class="text-xs text-secondary mt-sm">${receipts.length} struk tersimpan</p>
    </div>

    ${receipts.length > 0 ? `
      <div class="form-group">
        <input type="text" class="form-input" id="searchInput" placeholder="🔍 Cari struk..." style="font-size: 0.85rem;" />
      </div>
    ` : ''}

    <div id="receiptList">
      ${receipts.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
          </div>
          <div class="empty-state-title">Belum ada riwayat</div>
          <div class="empty-state-text">Struk yang kamu buat akan muncul di sini</div>
          <button class="btn btn-primary" onclick="location.hash='#/add'">Tambah Struk</button>
        </div>
      ` : renderReceiptList(receipts)}
    </div>
  `;

    // Search
    const searchInput = container.querySelector('#searchInput');
    searchInput?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = receipts.filter(r =>
            (r.storeName || '').toLowerCase().includes(q) ||
            (r.items || []).some(it => it.name.toLowerCase().includes(q))
        );
        container.querySelector('#receiptList').innerHTML = renderReceiptList(filtered);
        bindReceiptActions(container, receipts);
    });

    bindReceiptActions(container, receipts);
}

function renderReceiptList(receipts) {
    // Group by month
    const grouped = {};
    receipts.forEach(r => {
        const d = new Date(r.createdAt || r.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        if (!grouped[key]) grouped[key] = { label, items: [] };
        grouped[key].items.push(r);
    });

    return Object.entries(grouped).map(([, group]) => `
    <div class="mb-lg">
      <div class="text-xs text-secondary font-semibold mb-sm" style="text-transform: uppercase; letter-spacing: 0.5px;">
        ${group.label}
      </div>
      ${group.items.map((r, i) => `
        <div class="card mb-sm stagger-item" style="${staggerDelay(i)}; cursor: pointer;" data-receipt-id="${r.id}">
          <div class="flex items-center gap-md">
            <div class="list-item-icon" style="background: rgba(16, 185, 129, 0.15);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>
            </div>
            <div class="flex-1" style="min-width: 0;">
              <div class="font-medium text-sm truncate">${r.storeName || 'Struk'}</div>
              <div class="text-xs text-secondary mt-sm">${formatDate(r.createdAt)} · ${r.items?.length || 0} item</div>
            </div>
            <div class="text-right">
              <div class="amount amount-sm">${formatIDR(r.grandTotal || 0)}</div>
              ${r.splitResult ? `
                <div class="badge badge-accent mt-sm">${r.splitResult.length} orang</div>
              ` : `
                <div class="badge badge-warning mt-sm">Belum split</div>
              `}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function bindReceiptActions(container, allReceipts) {
    container.querySelectorAll('[data-receipt-id]').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.receiptId;
            window.location.hash = `#/split/${id}`;
        });

        // Long press to delete
        let timer;
        card.addEventListener('touchstart', () => {
            timer = setTimeout(async () => {
                const id = parseInt(card.dataset.receiptId);
                const receipt = allReceipts.find(r => r.id === id);
                const confirmed = await confirmDialog(`Hapus struk "${receipt?.storeName || 'Struk'}"?`);
                if (confirmed) {
                    await deleteReceipt(id);
                    showToast('Struk dihapus');
                    renderHistory(container);
                }
            }, 800);
        });
        card.addEventListener('touchend', () => clearTimeout(timer));
        card.addEventListener('touchmove', () => clearTimeout(timer));
    });
}
