// SpliBi - UI Helper utilities
// Toast notifications, modal management, avatar colors

const AVATAR_COLORS = [
    '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b',
    '#ef4444', '#ec4899', '#14b8a6', '#f97316',
    '#6366f1', '#84cc16', '#0ea5e9', '#d946ef'
];

/**
 * Show toast notification
 */
export function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Show modal with content
 */
export function showModal(contentHTML) {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    content.innerHTML = `<div class="modal-handle"></div>${contentHTML}`;
    overlay.classList.remove('hidden');

    // Close on overlay click
    const closeHandler = (e) => {
        if (e.target === overlay) {
            closeModal();
            overlay.removeEventListener('click', closeHandler);
        }
    };
    overlay.addEventListener('click', closeHandler);
}

/**
 * Close modal
 */
export function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.add('hidden');
}

/**
 * Get avatar color by index or name
 */
export function getAvatarColor(indexOrName) {
    if (typeof indexOrName === 'number') {
        return AVATAR_COLORS[indexOrName % AVATAR_COLORS.length];
    }
    // Hash string to get consistent color
    let hash = 0;
    for (let i = 0; i < String(indexOrName).length; i++) {
        hash = String(indexOrName).charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Get initials from name
 */
export function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Create avatar HTML
 */
export function avatarHTML(name, size = '') {
    const color = getAvatarColor(name);
    const initials = getInitials(name);
    const cls = size ? `avatar avatar-${size}` : 'avatar';
    return `<div class="${cls}" style="background:${color}">${initials}</div>`;
}

/**
 * Stagger animation delay for list items
 */
export function staggerDelay(index) {
    return `animation-delay: ${index * 50}ms`;
}

/**
 * Format date for display
 */
export function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;
        const dayMs = 86400000;

        if (diff < dayMs) return 'Hari ini';
        if (diff < dayMs * 2) return 'Kemarin';
        if (diff < dayMs * 7) return `${Math.floor(diff / dayMs)} hari lalu`;

        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    } catch {
        return dateStr;
    }
}

/**
 * Format full date
 */
export function formatFullDate(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

/**
 * Confirm dialog
 */
export function confirmDialog(message) {
    return new Promise(resolve => {
        showModal(`
      <div class="modal-title">Konfirmasi</div>
      <p class="text-sm text-secondary mb-xl">${message}</p>
      <div class="btn-group">
        <button class="btn btn-secondary flex-1" id="confirmNo">Batal</button>
        <button class="btn btn-danger flex-1" id="confirmYes">Hapus</button>
      </div>
    `);

        setTimeout(() => {
            document.getElementById('confirmNo')?.addEventListener('click', () => {
                closeModal();
                resolve(false);
            });
            document.getElementById('confirmYes')?.addEventListener('click', () => {
                closeModal();
                resolve(true);
            });
        }, 50);
    });
}
