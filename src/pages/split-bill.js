// SpliBi - Split Bill Page
import { getReceipt, saveReceipt, getAllGroups, generateId } from '../db.js';
import { formatIDR, parseIDR, calcSubtotal, calcTax, calcService, calcTip, calcGrandTotal, splitEqual, splitByProportion, splitByItems } from '../utils/calculator.js';
import { showToast, showModal, closeModal, avatarHTML, getAvatarColor, getInitials } from '../utils/ui.js';
import { downloadPDF, sharePDF } from '../utils/pdf-generator.js';

export async function renderSplitBill(container, params) {
  const receiptId = parseInt(params.id);
  let receipt = await getReceipt(receiptId);

  if (!receipt) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Struk tidak ditemukan</div></div>';
    return;
  }

  let splitMode = receipt.splitMode || 'equal'; // 'equal', 'items', 'proportion'
  let people = receipt.people || [];
  let taxPercent = receipt.taxPercent || 0;
  let servicePercent = receipt.servicePercent || 0;
  let tipPercent = receipt.tipPercent || 0;
  let discount = receipt.discount || 0;
  let splitResult = receipt.splitResult || [];

  function render() {
    const subtotal = calcSubtotal(receipt.items);
    const taxAmount = calcTax(subtotal, taxPercent);
    const serviceAmount = calcService(subtotal, servicePercent);
    const tipAmount = calcTip(subtotal, tipPercent);
    const grandTotal = calcGrandTotal({ subtotal, tax: taxAmount, service: serviceAmount, tip: tipAmount, discount });

    container.innerHTML = `
      <div class="mb-lg">
        <h2 style="font-size: 1.15rem; font-weight: 700;">${receipt.storeName || 'Split Bill'}</h2>
        <p class="text-xs text-secondary mt-sm">${receipt.items.length} item · ${formatDateShort(receipt.date)}</p>
      </div>

      <!-- Items Preview Card -->
      <div class="card mb-lg" id="itemsCard">
        <div class="section-header" style="margin-bottom: var(--space-md);">
          <span class="section-title text-sm">Daftar Item</span>
          <button class="btn btn-sm btn-outline" id="editItemsBtn">Edit</button>
        </div>
        ${receipt.items.map((item, i) => `
          <div class="item-row">
            <span class="item-num">${i + 1}</span>
            <span class="item-name text-sm truncate">${item.name}</span>
            <span class="item-qty">${item.qty > 1 ? item.qty + 'x' : ''}</span>
            <span class="item-price">${formatIDR(item.price * (item.qty || 1))}</span>
          </div>
        `).join('')}
        <div class="summary-section">
          <div class="summary-row">
            <span class="text-secondary">Subtotal</span>
            <span class="amount">${formatIDR(subtotal)}</span>
          </div>
        </div>
      </div>

      <!-- Tax, Service, Tip -->
      <div class="card mb-lg">
        <div class="section-header" style="margin-bottom: var(--space-md);">
          <span class="section-title text-sm">Pajak, Service & Tip</span>
        </div>

        <div class="flex items-center gap-sm mb-md">
          <label class="text-sm flex-1">Pajak (PB1)</label>
          <div class="input-row" style="width: 120px;">
            <input type="number" class="form-input" id="taxInput" value="${taxPercent}" style="padding: 6px 10px; font-size: 0.85rem; text-align: right;" min="0" max="100" step="0.5" />
            <span class="input-prefix">%</span>
          </div>
          <span class="text-xs amount" style="width: 80px; text-align: right;">${formatIDR(taxAmount)}</span>
        </div>

        <div class="flex items-center gap-sm mb-md">
          <label class="text-sm flex-1">Service</label>
          <div class="input-row" style="width: 120px;">
            <input type="number" class="form-input" id="serviceInput" value="${servicePercent}" style="padding: 6px 10px; font-size: 0.85rem; text-align: right;" min="0" max="100" step="0.5" />
            <span class="input-prefix">%</span>
          </div>
          <span class="text-xs amount" style="width: 80px; text-align: right;">${formatIDR(serviceAmount)}</span>
        </div>

        <div class="flex items-center gap-sm mb-md">
          <label class="text-sm flex-1">Tip</label>
          <div class="input-row" style="width: 120px;">
            <input type="number" class="form-input" id="tipInput" value="${tipPercent}" style="padding: 6px 10px; font-size: 0.85rem; text-align: right;" min="0" max="100" step="0.5" />
            <span class="input-prefix">%</span>
          </div>
          <span class="text-xs amount" style="width: 80px; text-align: right;">${formatIDR(tipAmount)}</span>
        </div>

        <div class="flex items-center gap-sm">
          <label class="text-sm flex-1">Diskon</label>
          <div class="input-row" style="width: 200px;">
            <span class="input-prefix">Rp</span>
            <input type="text" class="form-input form-input-amount" id="discountInput" value="${discount ? formatIDR(discount).replace('Rp ', '') : '0'}" style="padding: 6px 10px; font-size: 0.85rem;" />
          </div>
        </div>

        <div class="summary-section">
          <div class="summary-row total">
            <span>Grand Total</span>
            <span class="amount amount-lg">${formatIDR(grandTotal)}</span>
          </div>
        </div>
      </div>

      <!-- People Section -->
      <div class="card mb-lg">
        <div class="section-header" style="margin-bottom: var(--space-md);">
          <span class="section-title text-sm">Peserta (${people.length})</span>
          <div class="btn-group">
            <button class="btn btn-sm btn-outline" id="addFromGroupBtn">Dari Grup</button>
            <button class="btn btn-sm btn-primary" id="addPersonBtn">+ Tambah</button>
          </div>
        </div>

        ${people.length === 0 ? `
          <p class="text-xs text-secondary text-center" style="padding: var(--space-lg) 0;">Tambahkan peserta untuk mulai split bill</p>
        ` : `
          <div class="person-chips" id="peopleChips">
            ${people.map(p => `
              <div class="person-chip" data-person-id="${p.id}">
                <span class="avatar avatar-sm" style="background: ${getAvatarColor(p.name)}; width: 20px; height: 20px; font-size: 0.55rem;">${getInitials(p.name)}</span>
                ${p.name}
                <span class="chip-remove" data-remove-person="${p.id}">✕</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Split Mode -->
      ${people.length >= 2 ? `
        <div class="card mb-lg">
          <div class="section-header" style="margin-bottom: var(--space-md);">
            <span class="section-title text-sm">Mode Split</span>
          </div>

          <div class="tabs mb-lg" id="splitTabs">
            <div class="tab ${splitMode === 'equal' ? 'active' : ''}" data-split="equal">Sama Rata</div>
            <div class="tab ${splitMode === 'items' ? 'active' : ''}" data-split="items">Per Item</div>
            <div class="tab ${splitMode === 'proportion' ? 'active' : ''}" data-split="proportion">Proporsi</div>
          </div>

          <!-- Split Content -->
          <div id="splitContent">
            ${renderSplitContent(splitMode, people, receipt, grandTotal)}
          </div>
        </div>

        <!-- Split Result -->
        ${splitResult.length > 0 ? `
          <div class="card card-accent mb-lg">
            <div class="section-header" style="margin-bottom: var(--space-md);">
              <span class="section-title text-sm">Hasil Split 🎉</span>
            </div>
            ${splitResult.map(p => `
              <div class="list-item">
                ${avatarHTML(p.name, 'sm')}
                <div class="list-item-content">
                  <div class="list-item-title">${p.name}</div>
                  ${p.items ? `<div class="list-item-subtitle">${p.items.length} item</div>` : ''}
                </div>
                <div class="list-item-end">
                  <div class="amount">${formatIDR(p.amount)}</div>
                </div>
              </div>
            `).join('')}

            <div class="summary-section">
              <div class="summary-row total">
                <span>Total</span>
                <span class="amount">${formatIDR(splitResult.reduce((s, p) => s + p.amount, 0))}</span>
              </div>
            </div>

            <div class="flex gap-sm mt-lg">
              <button class="btn btn-outline flex-1" id="shareAllBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                Bagikan Semua
              </button>
              <button class="btn btn-primary flex-1" id="downloadPdfBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Download PDF
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Calculate Button -->
        <button class="btn btn-primary btn-block btn-lg" id="calculateBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><line x1="8" x2="8" y1="14" y2="14"/><line x1="12" x2="12" y1="14" y2="14"/><line x1="8" x2="8" y1="18" y2="18"/><line x1="12" x2="12" y1="18" y2="18"/><line x1="16" x2="16" y1="10" y2="10"/><line x1="8" x2="8" y1="10" y2="10"/><line x1="12" x2="12" y1="10" y2="10"/></svg>
          Hitung Split
        </button>
      ` : ''}
    `;

    bindEvents(subtotal, grandTotal, taxAmount, serviceAmount, tipAmount);
  }

  function bindEvents(subtotal, grandTotal, taxAmount, serviceAmount, tipAmount) {
    // Tax/Service/Tip inputs
    const taxInput = container.querySelector('#taxInput');
    const serviceInput = container.querySelector('#serviceInput');
    const tipInput = container.querySelector('#tipInput');
    const discountInput = container.querySelector('#discountInput');

    [taxInput, serviceInput, tipInput].forEach(input => {
      input?.addEventListener('change', (e) => {
        if (e.target.id === 'taxInput') taxPercent = parseFloat(e.target.value) || 0;
        if (e.target.id === 'serviceInput') servicePercent = parseFloat(e.target.value) || 0;
        if (e.target.id === 'tipInput') tipPercent = parseFloat(e.target.value) || 0;
        render();
      });
    });

    discountInput?.addEventListener('change', (e) => {
      discount = parseIDR(e.target.value);
      render();
    });

    // Add person
    container.querySelector('#addPersonBtn')?.addEventListener('click', () => {
      showModal(`
        <div class="modal-title">Tambah Peserta</div>
        <div class="form-group">
          <label class="form-label">Nama</label>
          <input type="text" class="form-input" id="personNameInput" placeholder="Nama peserta" autofocus />
        </div>
        <button class="btn btn-primary btn-block" id="confirmAddPerson">Tambah</button>
      `);

      setTimeout(() => {
        const input = document.getElementById('personNameInput');
        const btn = document.getElementById('confirmAddPerson');
        input?.focus();

        const addFn = () => {
          const name = input?.value.trim();
          if (name) {
            people.push({ id: generateId(), name });
            closeModal();
            render();
          }
        };

        btn?.addEventListener('click', addFn);
        input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') addFn(); });
      }, 100);
    });

    // Add from group
    container.querySelector('#addFromGroupBtn')?.addEventListener('click', async () => {
      const groups = await getAllGroups();
      if (groups.length === 0) {
        showToast('Belum ada grup. Buat grup dulu di menu Grup.', 'error');
        return;
      }

      showModal(`
        <div class="modal-title">Pilih Grup</div>
        ${groups.map(g => `
          <div class="list-item" style="cursor: pointer;" data-group-id="${g.id}">
            <div class="list-item-icon" style="background: var(--bg-tertiary);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="list-item-content">
              <div class="list-item-title">${g.name}</div>
              <div class="list-item-subtitle">${g.members.length} anggota</div>
            </div>
          </div>
        `).join('')}
      `);

      setTimeout(() => {
        document.querySelectorAll('[data-group-id]').forEach(el => {
          el.addEventListener('click', () => {
            const gid = parseInt(el.dataset.groupId);
            const group = groups.find(g => g.id === gid);
            if (group) {
              const existingIds = new Set(people.map(p => p.name));
              group.members.forEach(m => {
                if (!existingIds.has(m.name)) {
                  people.push({ id: generateId(), name: m.name });
                }
              });
              closeModal();
              render();
            }
          });
        });
      }, 100);
    });

    // Remove person
    container.querySelectorAll('[data-remove-person]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = e.currentTarget.dataset.removePerson;
        people = people.filter(p => p.id !== pid);
        // Also remove from item assignments
        receipt.items.forEach(item => {
          item.assignedTo = (item.assignedTo || []).filter(id => id !== pid);
        });
        render();
      });
    });

    // Split mode tabs
    container.querySelector('#splitTabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      splitMode = tab.dataset.split;
      splitResult = [];
      render();
    });

    // Item assignment for "per item" mode
    container.querySelectorAll('.assign-person-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const itemId = chip.dataset.itemId;
        const personId = chip.dataset.personId;
        const item = receipt.items.find(it => it.id === itemId);
        if (!item) return;

        if (!item.assignedTo) item.assignedTo = [];
        const idx = item.assignedTo.indexOf(personId);
        if (idx >= 0) {
          item.assignedTo.splice(idx, 1);
        } else {
          item.assignedTo.push(personId);
        }
        render();
      });
    });

    // Proportion inputs
    container.querySelectorAll('.proportion-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const pid = e.target.dataset.personId;
        const person = people.find(p => p.id === pid);
        if (person) {
          person.proportion = parseFloat(e.target.value) || 0;
        }
      });
    });

    // Calculate Button
    container.querySelector('#calculateBtn')?.addEventListener('click', async () => {
      const sub = calcSubtotal(receipt.items);
      const tx = calcTax(sub, taxPercent);
      const sv = calcService(sub, servicePercent);
      const tp = calcTip(sub, tipPercent);
      const gt = calcGrandTotal({ subtotal: sub, tax: tx, service: sv, tip: tp, discount });

      if (splitMode === 'equal') {
        const amounts = splitEqual({ grandTotal: gt, numPeople: people.length });
        splitResult = people.map((p, i) => ({
          ...p,
          amount: amounts[i]
        }));
      } else if (splitMode === 'proportion') {
        const propsToUse = people.map(p => ({
          ...p,
          proportion: p.proportion || 1
        }));
        splitResult = splitByProportion({ grandTotal: gt, people: propsToUse });
      } else if (splitMode === 'items') {
        splitResult = splitByItems({
          items: receipt.items,
          people,
          taxPercent,
          servicePercent,
          tipPercent,
          discount
        });
      }

      // Save
      receipt.taxPercent = taxPercent;
      receipt.servicePercent = servicePercent;
      receipt.tipPercent = tipPercent;
      receipt.taxAmount = tx;
      receipt.serviceAmount = sv;
      receipt.tipAmount = tp;
      receipt.discount = discount;
      receipt.grandTotal = gt;
      receipt.splitMode = splitMode;
      receipt.people = people;
      receipt.splitResult = splitResult;
      await saveReceipt(receipt);

      showToast('Split berhasil dihitung! ✓');
      render();
    });

    // Edit items -> go back to add
    container.querySelector('#editItemsBtn')?.addEventListener('click', () => {
      window.location.hash = `#/add?edit=${receiptId}`;
    });

    // Share & Download
    container.querySelector('#shareAllBtn')?.addEventListener('click', () => {
      sharePDF(receipt);
    });

    container.querySelector('#downloadPdfBtn')?.addEventListener('click', () => {
      downloadPDF(receipt);
    });

    // Per-person share buttons
    container.querySelectorAll('[data-share-person]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pid = e.currentTarget.dataset.sharePerson;
        const person = splitResult.find(p => p.id === pid);
        if (person) sharePDF(receipt, person);
      });
    });
  }

  render();
}

function renderSplitContent(mode, people, receipt, grandTotal) {
  if (mode === 'equal') {
    const perPerson = people.length > 0 ? Math.ceil(grandTotal / people.length) : 0;
    return `
      <div class="text-center" style="padding: var(--space-md) 0;">
        <p class="text-xs text-secondary mb-sm">Setiap orang membayar</p>
        <p class="amount amount-lg">${formatIDR(perPerson)}</p>
        <p class="text-xs text-secondary mt-sm">${formatIDR(grandTotal)} ÷ ${people.length} orang</p>
      </div>
    `;
  }

  if (mode === 'items') {
    return `
      <p class="text-xs text-secondary mb-md">Tap nama peserta untuk assign ke item</p>
      ${receipt.items.map(item => `
        <div style="padding: var(--space-sm) 0; border-bottom: 1px solid var(--border-primary);">
          <div class="flex items-center justify-between mb-sm">
            <span class="text-sm font-medium truncate" style="flex: 1;">${item.name}</span>
            <span class="amount amount-sm">${formatIDR(item.price * (item.qty || 1))}</span>
          </div>
          <div class="person-chips">
            ${people.map(p => `
              <div class="person-chip assign-person-chip ${(item.assignedTo || []).includes(p.id) ? 'selected' : ''}" data-item-id="${item.id}" data-person-id="${p.id}">
                ${getInitials(p.name)} ${p.name.split(' ')[0]}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    `;
  }

  if (mode === 'proportion') {
    return `
      <p class="text-xs text-secondary mb-md">Atur proporsi untuk setiap peserta</p>
      ${people.map(p => `
        <div class="flex items-center gap-sm mb-sm">
          ${avatarHTML(p.name, 'sm')}
          <span class="text-sm flex-1">${p.name}</span>
          <div class="input-row" style="width: 80px;">
            <input type="number" class="form-input proportion-input" data-person-id="${p.id}" value="${p.proportion || 1}" style="padding: 6px 10px; font-size: 0.85rem; text-align: center;" min="0" step="0.5" />
          </div>
        </div>
      `).join('')}
    `;
  }

  return '';
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}
