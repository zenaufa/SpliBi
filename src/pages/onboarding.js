// SpliBi - Onboarding Page
// Multi-step first-time setup: Welcome → API Key Guide → API Key Input

import { setSetting } from '../db.js';
import { showToast } from '../utils/ui.js';

export async function renderOnboarding(container) {
  let currentStep = 0;
  const totalSteps = 3;

  // Render onboarding directly to body to escape .page transform context
  const wrapper = document.createElement('div');
  wrapper.id = 'onboardingWrapper';
  wrapper.innerHTML = `
    <div class="onboarding">
      <!-- Step Indicators -->
      <div class="onboarding-dots">
        <span class="onboarding-dot active" data-step="0"></span>
        <span class="onboarding-dot" data-step="1"></span>
        <span class="onboarding-dot" data-step="2"></span>
      </div>

      <!-- Slides Container -->
      <div class="onboarding-slides">

        <!-- Slide 0: Welcome -->
        <div class="onboarding-slide active" data-slide="0">
          <div class="onboarding-slide-scroll">
            <div class="onboarding-hero">
              <div class="onboarding-logo">
                <span class="onboarding-logo-icon">🧾</span>
                <div class="onboarding-logo-glow"></div>
              </div>
              <h1 class="onboarding-title">SpliBi</h1>
              <p class="onboarding-subtitle">Split Bill Bareng</p>
            </div>
            <div class="onboarding-content">
              <div class="onboarding-features">
                <div class="onboarding-feature">
                  <span class="onboarding-feature-icon">📸</span>
                  <div>
                    <div class="onboarding-feature-title">Scan Struk Otomatis</div>
                    <div class="onboarding-feature-desc">Foto struk, AI langsung baca semua itemnya</div>
                  </div>
                </div>
                <div class="onboarding-feature">
                  <span class="onboarding-feature-icon">👥</span>
                  <div>
                    <div class="onboarding-feature-title">Split Mudah</div>
                    <div class="onboarding-feature-desc">Pilih siapa makan apa, hitung otomatis</div>
                  </div>
                </div>
                <div class="onboarding-feature">
                  <span class="onboarding-feature-icon">🔒</span>
                  <div>
                    <div class="onboarding-feature-title">Data Lokal</div>
                    <div class="onboarding-feature-desc">Semua data tersimpan di perangkatmu</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="onboarding-actions">
            <button class="btn btn-primary btn-block btn-lg" id="onboardingNext0">
              Lanjut
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        <!-- Slide 1: API Key Guide -->
        <div class="onboarding-slide" data-slide="1">
          <div class="onboarding-slide-scroll">
            <div class="onboarding-slide-header">
              <span class="badge badge-warning" style="margin-bottom: var(--space-sm);">Opsional</span>
              <div class="onboarding-slide-icon">🤖</div>
              <h2 class="onboarding-slide-title">Dapatkan API Key Gemini</h2>
              <p class="onboarding-slide-desc">API key gratis untuk scan struk dengan AI. Ikuti langkah berikut:</p>
            </div>
            <div class="onboarding-content">
              <div class="onboarding-steps">
                <div class="onboarding-step">
                  <div class="onboarding-step-num">1</div>
                  <div class="onboarding-step-body">
                    <div class="onboarding-step-title">Buka Google AI Studio</div>
                    <div class="onboarding-step-desc">Kunjungi website berikut:</div>
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" class="onboarding-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                      aistudio.google.com/apikey
                    </a>
                  </div>
                </div>
                <div class="onboarding-step">
                  <div class="onboarding-step-num">2</div>
                  <div class="onboarding-step-body">
                    <div class="onboarding-step-title">Login dengan Google</div>
                    <div class="onboarding-step-desc">Masuk menggunakan akun Googlemu (Gmail)</div>
                  </div>
                </div>
                <div class="onboarding-step">
                  <div class="onboarding-step-num">3</div>
                  <div class="onboarding-step-body">
                    <div class="onboarding-step-title">Buat API Key</div>
                    <div class="onboarding-step-desc">Klik tombol <strong>"Create API Key"</strong>, lalu pilih project atau buat baru</div>
                  </div>
                </div>
                <div class="onboarding-step">
                  <div class="onboarding-step-num">4</div>
                  <div class="onboarding-step-body">
                    <div class="onboarding-step-title">Salin API Key</div>
                    <div class="onboarding-step-desc">Klik tombol <strong>"Copy"</strong> untuk menyalin key-nya</div>
                  </div>
                </div>
              </div>
              <div class="onboarding-info-card">
                <span>💡</span>
                <span>API key Gemini <strong>gratis</strong> untuk penggunaan pribadi dengan batas harian yang cukup besar.</span>
              </div>
            </div>
          </div>
          <div class="onboarding-actions onboarding-actions-stacked">
            <div class="onboarding-actions-row">
              <button class="btn btn-secondary" id="onboardingBack1">Kembali</button>
              <button class="btn btn-primary flex-1" id="onboardingNext1">
                Lanjut
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
            <button class="btn btn-block" id="onboardingSkip1" style="color: var(--text-secondary); font-size: 0.85rem; padding: var(--space-sm);">
              Tidak, lain kali saja →
            </button>
          </div>
        </div>

        <!-- Slide 2: API Key Input -->
        <div class="onboarding-slide" data-slide="2">
          <div class="onboarding-slide-scroll">
            <div class="onboarding-slide-header">
              <div class="onboarding-slide-icon">🔑</div>
              <h2 class="onboarding-slide-title">Masukkan API Key</h2>
              <p class="onboarding-slide-desc">Paste API key yang sudah kamu salin dari Google AI Studio</p>
            </div>
            <div class="onboarding-content">
              <div class="onboarding-input-card">
                <label class="form-label" for="onboardingApiKey">Gemini API Key</label>
                <div style="position: relative;">
                  <input type="password" class="form-input" id="onboardingApiKey" placeholder="AIzaSy..." style="padding-right: 44px; font-size: 0.95rem;" autocomplete="off" />
                  <button type="button" id="onboardingToggleKey" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; font-size: 1.1rem;" title="Tampilkan/sembunyikan key">👁️</button>
                </div>
                <div class="onboarding-key-hint" id="onboardingKeyHint">
                  Key dimulai dengan "AIza..."
                </div>
              </div>
              <div class="onboarding-info-card">
                <span>🔒</span>
                <span>API key disimpan <strong>lokal di perangkatmu</strong>. Tidak dikirim ke server manapun kecuali Google.</span>
              </div>
            </div>
          </div>
          <div class="onboarding-actions onboarding-actions-stacked">
            <div class="onboarding-actions-row">
              <button class="btn btn-secondary" id="onboardingBack2">Kembali</button>
              <button class="btn btn-primary flex-1" id="onboardingStart">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                Mulai Pakai SpliBi
              </button>
            </div>
            <button class="btn btn-block" id="onboardingSkip" style="color: var(--text-secondary); font-size: 0.85rem; padding: var(--space-sm);">
              Lewati, nanti saja →
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  // Cleanup function to remove onboarding from body
  function cleanup() {
    wrapper.remove();
  }

  // Remove onboarding when navigating away (e.g. hash change)
  const hashHandler = () => {
    if (window.location.hash !== '#/onboarding') {
      cleanup();
      window.removeEventListener('hashchange', hashHandler);
    }
  };
  window.addEventListener('hashchange', hashHandler);

  // Step navigation functions
  function goToStep(step) {
    if (step < 0 || step >= totalSteps) return;
    currentStep = step;

    // Update slides
    wrapper.querySelectorAll('.onboarding-slide').forEach(slide => {
      const s = parseInt(slide.dataset.slide);
      slide.classList.remove('active', 'prev');
      if (s === currentStep) slide.classList.add('active');
      if (s < currentStep) slide.classList.add('prev');
    });

    // Update dots
    wrapper.querySelectorAll('.onboarding-dot').forEach(dot => {
      const d = parseInt(dot.dataset.step);
      dot.classList.toggle('active', d === currentStep);
      dot.classList.toggle('completed', d < currentStep);
    });
  }

  // Navigation button handlers
  wrapper.querySelector('#onboardingNext0')?.addEventListener('click', () => goToStep(1));
  wrapper.querySelector('#onboardingBack1')?.addEventListener('click', () => goToStep(0));
  wrapper.querySelector('#onboardingNext1')?.addEventListener('click', () => goToStep(2));
  wrapper.querySelector('#onboardingBack2')?.addEventListener('click', () => goToStep(1));

  // Skip from slide 1
  wrapper.querySelector('#onboardingSkip1')?.addEventListener('click', async () => {
    await setSetting('onboardingComplete', true);
    showToast('Kamu bisa menambahkan API key nanti di Pengaturan');
    window.location.hash = '#/';
  });

  // Toggle key visibility
  wrapper.querySelector('#onboardingToggleKey')?.addEventListener('click', () => {
    const input = wrapper.querySelector('#onboardingApiKey');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // Complete onboarding with API key
  wrapper.querySelector('#onboardingStart')?.addEventListener('click', async () => {
    const apiKey = wrapper.querySelector('#onboardingApiKey').value.trim();
    if (!apiKey) {
      const hint = wrapper.querySelector('#onboardingKeyHint');
      hint.textContent = '⚠️ Masukkan API key atau klik "Lewati" di bawah';
      hint.style.color = 'var(--text-danger)';
      return;
    }
    await setSetting('geminiApiKey', apiKey);
    await setSetting('onboardingComplete', true);
    showToast('API key tersimpan! Selamat datang di SpliBi 🎉');
    window.location.hash = '#/';
  });

  // Skip onboarding
  wrapper.querySelector('#onboardingSkip')?.addEventListener('click', async () => {
    await setSetting('onboardingComplete', true);
    showToast('Kamu bisa menambahkan API key nanti di Pengaturan');
    window.location.hash = '#/';
  });
}

