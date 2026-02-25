// SpliBi - Groups Page
import { getAllGroups, saveGroup, deleteGroup, generateId } from '../db.js';
import { showToast, showModal, closeModal, confirmDialog, avatarHTML, getAvatarColor, getInitials, staggerDelay } from '../utils/ui.js';

export async function renderGroups(container) {
    const groups = await getAllGroups();

    container.innerHTML = `
    <div class="flex items-center justify-between mb-lg">
      <div>
        <h2 style="font-size: 1.15rem; font-weight: 700;">Grup</h2>
        <p class="text-xs text-secondary mt-sm">Kelola grup patungan</p>
      </div>
      <button class="btn btn-primary btn-sm" id="createGroupBtn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        Buat Grup
      </button>
    </div>

    <div id="groupsList">
      ${groups.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="empty-state-title">Belum ada grup</div>
          <div class="empty-state-text">Buat grup untuk orang-orang yang sering patungan bareng!</div>
        </div>
      ` : groups.map((g, i) => `
        <div class="card mb-md stagger-item" style="${staggerDelay(i)}" data-group="${g.id}">
          <div class="flex items-center justify-between mb-md">
            <div class="flex items-center gap-md">
              <div class="list-item-icon" style="background: ${getAvatarColor(g.name)}20;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${getAvatarColor(g.name)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <div class="font-semibold text-sm">${g.name}</div>
                <div class="text-xs text-secondary">${g.members.length} anggota</div>
              </div>
            </div>
            <div class="btn-group">
              <button class="btn-icon" data-edit-group="${g.id}" style="width: 32px; height: 32px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
              <button class="btn-icon" data-delete-group="${g.id}" style="width: 32px; height: 32px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>

          <div class="avatar-group">
            ${g.members.slice(0, 6).map(m => avatarHTML(m.name, 'sm')).join('')}
            ${g.members.length > 6 ? `<div class="avatar avatar-sm" style="background: var(--bg-tertiary);">+${g.members.length - 6}</div>` : ''}
          </div>

          ${g.members.length > 0 ? `
            <div class="mt-sm text-xs text-secondary">
              ${g.members.map(m => m.name).join(', ')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

    // Create group
    container.querySelector('#createGroupBtn').addEventListener('click', () => showGroupModal());

    // Edit group
    container.querySelectorAll('[data-edit-group]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = parseInt(e.currentTarget.dataset.editGroup);
            const group = groups.find(g => g.id === id);
            if (group) showGroupModal(group);
        });
    });

    // Delete group
    container.querySelectorAll('[data-delete-group]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = parseInt(e.currentTarget.dataset.deleteGroup);
            const group = groups.find(g => g.id === id);
            const confirmed = await confirmDialog(`Hapus grup "${group?.name}"?`);
            if (confirmed) {
                await deleteGroup(id);
                showToast('Grup dihapus');
                renderGroups(container);
            }
        });
    });

    function showGroupModal(existingGroup = null) {
        const isEdit = !!existingGroup;
        let members = existingGroup ? [...existingGroup.members] : [];

        const renderMembers = () => {
            const el = document.getElementById('membersList');
            if (!el) return;
            el.innerHTML = members.length === 0 ? '<p class="text-xs text-secondary text-center" style="padding: var(--space-md) 0;">Belum ada anggota</p>' : members.map((m, i) => `
        <div class="flex items-center gap-sm mb-sm">
          ${avatarHTML(m.name, 'sm')}
          <span class="text-sm flex-1">${m.name}</span>
          <button class="btn-icon" data-remove-member="${i}" style="width: 24px; height: 24px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      `).join('');

            el.querySelectorAll('[data-remove-member]').forEach(btn => {
                btn.addEventListener('click', () => {
                    members.splice(parseInt(btn.dataset.removeMember), 1);
                    renderMembers();
                });
            });
        };

        showModal(`
      <div class="modal-title">${isEdit ? 'Edit Grup' : 'Buat Grup Baru'}</div>
      <div class="form-group">
        <label class="form-label">Nama Grup</label>
        <input type="text" class="form-input" id="groupNameInput" placeholder="cth. Geng Makan Siang" value="${existingGroup?.name || ''}" />
      </div>

      <div class="section-header mt-lg">
        <span class="section-title text-sm">Anggota</span>
        <button class="btn btn-sm btn-outline" id="addMemberBtn">+ Tambah</button>
      </div>

      <div id="membersList"></div>

      <button class="btn btn-primary btn-block mt-xl" id="saveGroupBtn">${isEdit ? 'Simpan' : 'Buat Grup'}</button>
    `);

        setTimeout(() => {
            renderMembers();

            document.getElementById('addMemberBtn')?.addEventListener('click', () => {
                const name = prompt('Nama anggota:');
                if (name?.trim()) {
                    members.push({ id: generateId(), name: name.trim() });
                    renderMembers();
                }
            });

            document.getElementById('saveGroupBtn')?.addEventListener('click', async () => {
                const name = document.getElementById('groupNameInput')?.value.trim();
                if (!name) {
                    showToast('Masukkan nama grup', 'error');
                    return;
                }

                const group = {
                    ...(existingGroup || {}),
                    name,
                    members
                };

                await saveGroup(group);
                closeModal();
                showToast(isEdit ? 'Grup diperbarui!' : 'Grup berhasil dibuat!');
                renderGroups(container);
            });
        }, 100);
    }
}
