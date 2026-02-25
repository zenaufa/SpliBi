// SpliBi - Add Receipt Page
import { saveReceipt, generateId } from '../db.js';
import { parseIDR, formatIDR } from '../utils/calculator.js';
import { showToast } from '../utils/ui.js';

export async function renderAddReceipt(container) {
  container.innerHTML = `
    <div class="mb-lg">
      <h2 style="font-size: 1.15rem; font-weight: 700;">Tambah Struk</h2>
      <p class="text-xs text-secondary mt-sm">Pilih cara input struk</p>
    </div>

    <!-- Input Mode Tabs -->
    <div class="tabs mb-xl" id="inputTabs">
      <div class="tab" data-mode="camera">📸 Kamera</div>
      <div class="tab" data-mode="gallery">🖼️ Galeri</div>
      <div class="tab active" data-mode="manual">✏️ Manual</div>
    </div>

    <!-- Camera Mode -->
    <div class="input-mode hidden" id="cameraMode">
      <div class="camera-area" id="cameraArea">
        <video id="cameraVideo" autoplay playsinline></video>
        <div class="camera-controls">
          <button class="capture-btn" id="captureBtn"></button>
        </div>
      </div>
      <canvas id="cameraCanvas" style="display:none;"></canvas>
      <div class="mt-md text-center">
        <p class="text-xs text-secondary">Arahkan kamera ke struk, lalu tap tombol untuk foto</p>
      </div>
    </div>

    <!-- Gallery Mode -->
    <div class="input-mode hidden" id="galleryMode">
      <div class="upload-area" id="uploadArea">
        <svg class="upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        <p class="font-medium mb-sm" style="font-size: 0.9rem;">Upload Foto Struk</p>
        <p class="text-xs text-secondary">Tap atau drag foto struk ke sini</p>
        <input type="file" id="fileInput" accept="image/*" style="display: none;" />
      </div>
      <div class="hidden mt-md" id="imagePreview">
        <div style="position: relative; border-radius: var(--radius-lg); overflow: hidden;">
          <img id="previewImg" style="width: 100%; border-radius: var(--radius-lg);" />
          <button class="btn btn-sm btn-secondary" id="clearImage" style="position: absolute; top: 8px; right: 8px;">✕</button>
        </div>
      </div>
    </div>

    <!-- OCR Loading -->
    <div class="hidden" id="ocrLoading">
      <div class="card" style="text-align: center; padding: var(--space-3xl) var(--space-lg);">
        <div class="spinner" style="margin: 0 auto var(--space-lg);"></div>
        <p class="font-medium mb-sm">Memproses Struk...</p>
        <p class="text-xs text-secondary" id="ocrProgress">Mempersiapkan OCR...</p>
        <div style="margin-top: var(--space-lg); background: var(--bg-tertiary); border-radius: var(--radius-full); height: 4px; overflow: hidden;">
          <div id="ocrProgressBar" style="height: 100%; background: var(--accent-gradient); border-radius: var(--radius-full); width: 0%; transition: width 0.3s;"></div>
        </div>
      </div>
    </div>

    <!-- Manual Input Form -->
    <div class="input-mode" id="manualMode">
      <div class="form-group">
        <label class="form-label">Nama Tempat / Restoran</label>
        <input type="text" class="form-input" id="storeName" placeholder="cth. Warteg Pak Joko" />
      </div>

      <div class="form-group">
        <label class="form-label">Tanggal</label>
        <input type="date" class="form-input" id="receiptDate" value="${new Date().toISOString().split('T')[0]}" />
      </div>

      <div class="section-header mt-lg">
        <h3 class="section-title">Daftar Item</h3>
        <button class="btn btn-sm btn-outline" id="addItemBtn">+ Item</button>
      </div>

      <div id="itemsList">
        <!-- Item rows added here -->
      </div>

      <div class="summary-section" id="summarySection">
        <div class="summary-row">
          <span class="text-secondary">Subtotal</span>
          <span class="amount" id="subtotalDisplay">Rp 0</span>
        </div>
      </div>

      <button class="btn btn-primary btn-block btn-lg mt-xl" id="saveReceiptBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        Lanjut ke Split Bill
      </button>
    </div>
  `;

  // State
  let items = [
    { id: generateId(), name: '', price: 0, qty: 1 }
  ];
  let cameraStream = null;

  const itemsList = container.querySelector('#itemsList');
  const subtotalDisplay = container.querySelector('#subtotalDisplay');

  // Render items
  function renderItems() {
    itemsList.innerHTML = items.map((item, i) => `
      <div class="item-row" data-id="${item.id}">
        <span class="item-num">${i + 1}</span>
        <input type="text" class="form-input item-name-input" placeholder="Nama item" value="${escapeAttr(item.name)}" data-field="name" data-id="${item.id}" style="padding: 8px; font-size: 0.85rem;" />
        <input type="number" class="form-input item-qty-input" value="${item.qty}" data-field="qty" data-id="${item.id}" style="width: 44px; padding: 8px; text-align: center; font-size: 0.85rem;" min="1" />
        <input type="text" class="form-input item-price-input form-input-amount" placeholder="Harga" value="${item.price ? formatIDR(item.price).replace('Rp ', '') : ''}" data-field="price" data-id="${item.id}" style="width: 110px; padding: 8px; font-size: 0.85rem;" />
        <button class="btn-icon" data-remove="${item.id}" style="width: 28px; height: 28px; flex-shrink: 0; ${items.length <= 1 ? 'visibility: hidden;' : ''}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    `).join('');

    updateSubtotal();
    bindItemEvents();
  }

  function bindItemEvents() {
    itemsList.querySelectorAll('.item-name-input, .item-qty-input, .item-price-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = e.target.dataset.id;
        const field = e.target.dataset.field;
        const item = items.find(it => it.id === id);
        if (!item) return;

        if (field === 'name') {
          item.name = e.target.value;
        } else if (field === 'qty') {
          item.qty = parseInt(e.target.value) || 1;
        } else if (field === 'price') {
          item.price = parseIDR(e.target.value);
        }
        updateSubtotal();
      });

      // Format price on blur
      if (input.dataset.field === 'price') {
        input.addEventListener('blur', (e) => {
          const id = e.target.dataset.id;
          const item = items.find(it => it.id === id);
          if (item && item.price) {
            e.target.value = formatIDR(item.price).replace('Rp ', '');
          }
        });
        input.addEventListener('focus', (e) => {
          const id = e.target.dataset.id;
          const item = items.find(it => it.id === id);
          if (item && item.price) {
            e.target.value = item.price;
          }
        });
      }
    });

    itemsList.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.remove;
        items = items.filter(it => it.id !== id);
        renderItems();
      });
    });
  }

  function updateSubtotal() {
    const sub = items.reduce((s, it) => s + (it.price * (it.qty || 1)), 0);
    subtotalDisplay.textContent = formatIDR(sub);
  }

  // Add item button
  container.querySelector('#addItemBtn').addEventListener('click', () => {
    items.push({ id: generateId(), name: '', price: 0, qty: 1 });
    renderItems();
    // Focus on the new item name
    setTimeout(() => {
      const inputs = itemsList.querySelectorAll('.item-name-input');
      inputs[inputs.length - 1]?.focus();
    }, 50);
  });

  // Tab switching
  container.querySelector('#inputTabs').addEventListener('click', async (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;

    const mode = tab.dataset.mode;
    container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    container.querySelectorAll('.input-mode').forEach(m => m.classList.add('hidden'));
    container.querySelector(`#${mode}Mode`)?.classList.remove('hidden');

    // Start camera if needed
    if (mode === 'camera') {
      await startCamera();
    } else {
      stopCamera();
    }
  });

  // Camera functions
  async function startCamera() {
    try {
      const video = container.querySelector('#cameraVideo');
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 1920 } }
      });
      video.srcObject = cameraStream;
    } catch (err) {
      showToast('Tidak dapat mengakses kamera. Gunakan galeri atau input manual.', 'error');
      container.querySelector('[data-mode="manual"]').click();
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
  }

  // Capture photo
  container.querySelector('#captureBtn')?.addEventListener('click', async () => {
    const video = container.querySelector('#cameraVideo');
    const canvas = container.querySelector('#cameraCanvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    stopCamera();
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.8));
    await processImage(blob);
  });

  // Gallery upload
  const uploadArea = container.querySelector('#uploadArea');
  const fileInput = container.querySelector('#fileInput');

  uploadArea?.addEventListener('click', () => fileInput.click());
  uploadArea?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea?.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });
  uploadArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  function handleFile(file) {
    const preview = container.querySelector('#imagePreview');
    const img = container.querySelector('#previewImg');
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
      preview.classList.remove('hidden');
      uploadArea.classList.add('hidden');
      processImage(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  container.querySelector('#clearImage')?.addEventListener('click', () => {
    container.querySelector('#imagePreview').classList.add('hidden');
    container.querySelector('#uploadArea').classList.remove('hidden');
    fileInput.value = '';
  });

  // Process image with OCR
  async function processImage(imageData) {
    const ocrLoading = container.querySelector('#ocrLoading');
    const ocrProgress = container.querySelector('#ocrProgress');
    const progressBar = container.querySelector('#ocrProgressBar');
    const manualMode = container.querySelector('#manualMode');

    ocrLoading.classList.remove('hidden');

    try {
      const { processReceiptImage } = await import('../utils/ocr.js');
      const result = await processReceiptImage(imageData, (progress) => {
        progressBar.style.width = `${progress}%`;
        if (progress < 30) ocrProgress.textContent = 'Mempersiapkan OCR...';
        else if (progress < 80) ocrProgress.textContent = 'Membaca teks dari struk...';
        else ocrProgress.textContent = 'Menganalisis data...';
      });

      // Fill form with OCR results
      container.querySelector('#storeName').value = result.storeName || '';
      if (result.date) container.querySelector('#receiptDate').value = result.date;

      if (result.items.length > 0) {
        items = result.items.map(it => ({
          id: generateId(),
          name: it.name,
          price: it.price,
          qty: it.qty || 1
        }));
      }

      renderItems();
      showToast(`Berhasil membaca ${result.items.length} item dari struk!`);

      // Switch to manual mode to review
      container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      container.querySelector('[data-mode="manual"]').classList.add('active');
      container.querySelectorAll('.input-mode').forEach(m => m.classList.add('hidden'));
      manualMode.classList.remove('hidden');

    } catch (err) {
      showToast(err.message || 'Gagal memproses gambar', 'error');
    } finally {
      ocrLoading.classList.add('hidden');
    }
  }

  // Save receipt
  container.querySelector('#saveReceiptBtn').addEventListener('click', async () => {
    const validItems = items.filter(it => it.name.trim() && it.price > 0);

    if (validItems.length === 0) {
      showToast('Tambahkan minimal 1 item dengan nama dan harga', 'error');
      return;
    }

    const receipt = {
      storeName: container.querySelector('#storeName').value.trim() || 'Struk',
      date: container.querySelector('#receiptDate').value,
      items: validItems.map(it => ({
        id: it.id,
        name: it.name.trim(),
        price: it.price,
        qty: it.qty || 1,
        assignedTo: []
      })),
      taxPercent: 0,
      servicePercent: 0,
      tipPercent: 0,
      discount: 0,
      grandTotal: validItems.reduce((s, it) => s + it.price * (it.qty || 1), 0),
      splitMode: null,
      splitResult: null
    };

    const id = await saveReceipt(receipt);
    stopCamera();
    showToast('Struk berhasil disimpan! ✓');
    window.location.hash = `#/split/${id}`;
  });

  // Initial render
  renderItems();
}

function escapeAttr(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
