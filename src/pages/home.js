// SpliBi - Home Page
import { getAllReceipts } from '../db.js';
import { formatIDR } from '../utils/calculator.js';
import { avatarHTML, formatDate, staggerDelay } from '../utils/ui.js';

export async function renderHome(container) {
    const receipts = await getAllReceipts();
    const recentReceipts = receipts.slice(0, 5);

    // Stats
    const totalBills = receipts.length;
    const totalAmount = receipts.reduce((s, r) => s + (r.grandTotal || 0), 0);
    const thisMonth = receipts.filter(r => {
        const d = new Date(r.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthAmount = thisMonth.reduce((s, r) => s + (r.grandTotal || 0), 0);

    container.innerHTML = `
    <div class="mb-xl">
      <h2 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 4px;">
        Halo! 👋
      </h2>
      <p class="text-sm text-secondary">Yuk patungan bareng teman-teman</p>
    </div>

    <!-- Quick Actions -->
    <div class="card card-accent mb-lg" style="cursor: pointer;" id="quickAddBtn">
      <div class="flex items-center gap-md">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
        </div>
        <div class="flex-1">
          <div class="font-semibold" style="font-size: 0.95rem;">Tambah Struk Baru</div>
          <div class="text-xs text-secondary">Foto, galeri, atau input manual</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid mb-xl">
      <div class="card stat-card stagger-item" style="${staggerDelay(0)}">
        <div class="stat-label">Total Struk</div>
        <div class="stat-value">${totalBills}</div>
      </div>
      <div class="card stat-card stagger-item" style="${staggerDelay(1)}">
        <div class="stat-label">Bulan Ini</div>
        <div class="stat-value amount-sm">${formatIDR(monthAmount)}</div>
      </div>
    </div>

    <!-- Recent Bills -->
    <div class="section-header">
      <h3 class="section-title">Struk Terbaru</h3>
      ${receipts.length > 5 ? '<a href="#/history" class="section-action">Lihat Semua</a>' : ''}
    </div>

    <div id="recentList">
      ${recentReceipts.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>
          </div>
          <div class="empty-state-title">Belum ada struk</div>
          <div class="empty-state-text">Tambah struk pertamamu untuk mulai split bill bareng teman!</div>
          <button class="btn btn-primary" id="emptyAddBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            Tambah Struk
          </button>
        </div>
      ` : recentReceipts.map((r, i) => `
        <a href="#/split/${r.id}" class="list-item stagger-item" style="${staggerDelay(i + 2)}; cursor: pointer;">
          <div class="list-item-icon" style="background: ${getReceiptColor(i)}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>
          </div>
          <div class="list-item-content">
            <div class="list-item-title">${r.storeName || 'Struk'}</div>
            <div class="list-item-subtitle">${formatDate(r.createdAt)} · ${r.items?.length || 0} item</div>
          </div>
          <div class="list-item-end">
            <div class="amount amount-sm">${formatIDR(r.grandTotal || 0)}</div>
            ${r.splitResult ? `<div class="text-xs text-secondary">${r.splitResult.length} orang</div>` : ''}
          </div>
        </a>
      `).join('')}
    </div>
  `;

    // Event listeners
    container.querySelector('#quickAddBtn')?.addEventListener('click', () => {
        window.location.hash = '#/add';
    });

    container.querySelector('#emptyAddBtn')?.addEventListener('click', () => {
        window.location.hash = '#/add';
    });
}

function getReceiptColor(index) {
    const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];
    return colors[index % colors.length];
}
