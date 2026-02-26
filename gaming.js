// ============================================
// A BOOGIE WIT DA HOODIE — Gaming Page Scripts
// ============================================

// --- Supabase Client ---
const SUPABASE_URL = 'https://voxnxjpwzqlggsznsrdj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveG54anB3enFsZ2dzem5zcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjQ1MDAsImV4cCI6MjA4NzY0MDUwMH0.4Ly0i0tPNw8y6GlLqeVhB-T-E8xfS164dSUEJtxUFb0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {

  // =========================
  // NAVIGATION
  // =========================
  const navToggle = document.getElementById('gm-nav-toggle');
  const navLinks = document.getElementById('gm-nav-links');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // =========================
  // SCROLL REVEAL (IntersectionObserver)
  // =========================
  const revealEls = document.querySelectorAll('.gm-reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => observer.observe(el));

  // =========================
  // TOAST NOTIFICATIONS
  // =========================
  let toastTimeout = null;
  function showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('visible');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2500);
  }

  // =========================
  // GAMING MODULE
  // =========================

  const gmLobby = document.getElementById('gm-lobby');
  const gmNoLobby = document.getElementById('gm-no-lobby');
  const gmLobbyGame = document.getElementById('gm-lobby-game');
  const gmLobbyCode = document.getElementById('gm-lobby-code');
  const gmQueueList = document.getElementById('gm-queue-list');
  const gmQueueEmpty = document.getElementById('gm-queue-empty');
  const gmQueueForm = document.getElementById('gm-queue-form');
  const gmQueueSuccess = document.getElementById('gm-queue-success');
  const gmOnlineList = document.getElementById('gm-online-list');
  const gmOnlineEmpty = document.getElementById('gm-online-empty');
  const gmForm = document.getElementById('gm-form');
  const gmSubmit = document.getElementById('gm-submit');
  const gmSuccess = document.getElementById('gm-success');
  const gmError = document.getElementById('gm-error');
  const gmErrorMsg = document.getElementById('gm-error-msg');

  // --- Load active lobby ---
  async function loadActiveLobby() {
    const { data: lobby } = await supabase
      .from('lobby')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lobby) {
      gmLobby.hidden = false;
      gmNoLobby.hidden = true;
      gmLobbyGame.textContent = lobby.game;
      gmLobbyCode.textContent = lobby.lobby_code;
      loadQueue(lobby.id);
    } else {
      gmLobby.hidden = true;
      gmNoLobby.hidden = false;
    }
  }

  // --- Load queue for active lobby ---
  async function loadQueue(lobbyId) {
    const { data: queue } = await supabase
      .from('lobby_queue')
      .select('*')
      .eq('lobby_id', lobbyId)
      .eq('status', 'waiting')
      .order('position', { ascending: true });

    if (!queue || !queue.length) {
      gmQueueList.innerHTML = '';
      gmQueueEmpty.hidden = false;
      return;
    }

    gmQueueEmpty.hidden = true;
    gmQueueList.innerHTML = queue.map((q, i) => `
      <li class="gm-queue-item">
        <span class="gm-queue-pos">#${i + 1}</span>
        <span class="gm-queue-name">${q.gamer_name}</span>
        ${q.psn_id ? `<span class="gm-queue-psn">${q.psn_id}</span>` : ''}
      </li>
    `).join('');

    gmQueueForm.dataset.lobbyId = lobbyId;
  }

  // --- Join queue ---
  gmQueueForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    gmQueueSuccess.hidden = true;

    const lobbyId = gmQueueForm.dataset.lobbyId;
    if (!lobbyId) return;

    const formData = new FormData(gmQueueForm);
    const gamerName = formData.get('gamer_name').trim();
    const psnId = formData.get('psn_id')?.trim() || null;

    const { data: existing } = await supabase
      .from('lobby_queue')
      .select('position')
      .eq('lobby_id', lobbyId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPos = (existing && existing.length > 0) ? existing[0].position + 1 : 1;

    const { error } = await supabase
      .from('lobby_queue')
      .insert([{ lobby_id: lobbyId, gamer_name: gamerName, psn_id: psnId, position: nextPos }]);

    if (error) {
      showToast('Failed to join queue');
      return;
    }

    gmQueueForm.reset();
    gmQueueSuccess.hidden = false;
    showToast("You're in line!");
    setTimeout(() => { gmQueueSuccess.hidden = true; }, 4000);
    loadQueue(lobbyId);
  });

  // --- Load online gamers ---
  async function loadOnlineGamers() {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: gamers } = await supabase
      .from('gamers')
      .select('display_name, psn_id, xbox_id, current_game, last_seen')
      .eq('is_online', true)
      .gte('last_seen', thirtyMinAgo)
      .order('last_seen', { ascending: false });

    if (!gamers || !gamers.length) {
      gmOnlineList.innerHTML = '';
      gmOnlineList.appendChild(gmOnlineEmpty);
      gmOnlineEmpty.style.display = '';
      return;
    }

    gmOnlineEmpty.style.display = 'none';
    gmOnlineList.innerHTML = gamers.map(g => `
      <div class="gm-online-card">
        <div class="gm-online-status"></div>
        <div class="gm-online-info">
          <span class="gm-online-name">${g.display_name}</span>
          ${g.current_game ? `<span class="gm-online-game">Playing ${g.current_game}</span>` : ''}
        </div>
        <div class="gm-online-ids">
          ${g.psn_id ? `<span class="gm-online-id">PSN: ${g.psn_id}</span>` : ''}
          ${g.xbox_id ? `<span class="gm-online-id">Xbox: ${g.xbox_id}</span>` : ''}
        </div>
      </div>
    `).join('');
  }

  // --- Register gamer / Join squad ---
  gmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    gmSuccess.hidden = true;
    gmError.hidden = true;

    const originalText = gmSubmit.textContent;
    gmSubmit.textContent = 'Joining...';
    gmSubmit.disabled = true;

    const formData = new FormData(gmForm);
    const gamer = {
      display_name: formData.get('display_name').trim(),
      psn_id: formData.get('psn_id')?.trim() || null,
      xbox_id: formData.get('xbox_id')?.trim() || null,
      email: formData.get('email')?.trim()?.toLowerCase() || null,
      favorite_game: formData.get('favorite_game') || null,
      is_online: true,
      last_seen: new Date().toISOString(),
      current_game: formData.get('favorite_game') || null,
    };

    try {
      const { error } = await supabase.from('gamers').insert([gamer]);

      if (error) {
        if (error.code === '23505') {
          gmErrorMsg.textContent = "You're already in the squad!";
        } else {
          gmErrorMsg.textContent = 'Something went wrong. Try again.';
          console.error('Gaming error:', error);
        }
        gmError.hidden = false;
        gmSubmit.textContent = originalText;
        gmSubmit.disabled = false;
        return;
      }

      gmForm.reset();
      gmSuccess.hidden = false;
      gmSubmit.textContent = "You're In!";
      gmSubmit.style.background = '#43b581';

      setTimeout(() => {
        gmSubmit.textContent = originalText;
        gmSubmit.style.background = '';
        gmSubmit.disabled = false;
        gmSuccess.hidden = true;
      }, 5000);

      loadOnlineGamers();
    } catch (err) {
      console.error('Network error:', err);
      gmErrorMsg.textContent = 'Network error. Check your connection.';
      gmError.hidden = false;
      gmSubmit.textContent = originalText;
      gmSubmit.disabled = false;
    }
  });

  // =========================
  // INIT
  // =========================
  loadActiveLobby();
  loadOnlineGamers();

  // Safety net: force hero visible if CSS animations don't fire
  setTimeout(() => {
    document.querySelectorAll('.gm-hero-logo, .gm-hero-title, .gm-hero-sub, .gm-hero-ctas, .gm-hero-scroll').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }, 1500);
});
