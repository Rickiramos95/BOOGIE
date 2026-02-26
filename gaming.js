// ============================================
// A BOOGIE WIT DA HOODIE — Gaming Page Scripts
// ============================================

// --- Supabase Client (safe init) ---
const SUPABASE_URL = 'https://voxnxjpwzqlggsznsrdj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveG54anB3enFsZ2dzem5zcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjQ1MDAsImV4cCI6MjA4NzY0MDUwMH0.4Ly0i0tPNw8y6GlLqeVhB-T-E8xfS164dSUEJtxUFb0';

let supabase;
try {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.warn('Supabase failed to init:', e);
}

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

  // =========================
  // LEADERBOARD
  // =========================
  const gmLbBody = document.getElementById('gm-lb-body');
  const gmLbFilters = document.querySelectorAll('.gm-lb-filter');
  let currentGameFilter = 'all';

  async function loadLeaderboard(gameFilter) {
    if (!supabase) return;
    try {
      let query = supabase
        .from('leaderboard')
        .select('*')
        .order('rank_position', { ascending: true });

      if (gameFilter && gameFilter !== 'all') {
        query = query.eq('game', gameFilter);
      }

      const { data: leaders, error } = await query.limit(10);

      if (error || !leaders || !leaders.length) {
        gmLbBody.innerHTML = '<tr><td colspan="7" class="gm-lb-loading">No rankings yet. Join the squad to compete!</td></tr>';
        return;
      }

      gmLbBody.innerHTML = leaders.map((p, i) => {
        const rank = i + 1;
        let rankClass = '';
        if (rank === 1) rankClass = 'gm-lb-rank--gold';
        else if (rank === 2) rankClass = 'gm-lb-rank--silver';
        else if (rank === 3) rankClass = 'gm-lb-rank--bronze';

        return `
          <tr>
            <td><span class="gm-lb-rank ${rankClass}">#${rank}</span></td>
            <td>
              <div class="gm-lb-player">
                <span class="gm-lb-avatar">${p.avatar_emoji || '🎮'}</span>
                <span class="gm-lb-gamertag">${p.gamertag}</span>
              </div>
            </td>
            <td><span class="gm-lb-platform">${p.platform || '--'}</span></td>
            <td><span class="gm-lb-game">${p.game || '--'}</span></td>
            <td><span class="gm-lb-wins">${p.wins}</span></td>
            <td><span class="gm-lb-kd">${p.kd_ratio ? p.kd_ratio.toFixed(2) : '--'}</span></td>
            <td><span class="gm-lb-score">${p.score ? p.score.toLocaleString() : '--'}</span></td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.warn('Leaderboard load error:', err);
      gmLbBody.innerHTML = '<tr><td colspan="7" class="gm-lb-loading">Failed to load rankings.</td></tr>';
    }
  }

  // Leaderboard filter buttons
  gmLbFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      gmLbFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGameFilter = btn.dataset.game;
      loadLeaderboard(currentGameFilter);
    });
  });

  // =========================
  // UPCOMING SESSIONS
  // =========================
  const gmSessionsGrid = document.getElementById('gm-sessions-grid');
  const gmSessionsEmpty = document.getElementById('gm-sessions-empty');

  async function loadUpcomingSessions() {
    if (!supabase) return;
    try {
      const { data: sessions, error } = await supabase
        .from('gaming_sessions')
        .select('*')
        .in('status', ['scheduled', 'live'])
        .order('scheduled_at', { ascending: true })
        .limit(6);

      if (error || !sessions || !sessions.length) {
        gmSessionsGrid.innerHTML = '';
        gmSessionsGrid.appendChild(gmSessionsEmpty);
        gmSessionsEmpty.style.display = '';
        return;
      }

      gmSessionsEmpty.style.display = 'none';
      gmSessionsGrid.innerHTML = sessions.map(s => {
        const date = new Date(s.scheduled_at);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const statusClass = s.status === 'live' ? 'gm-session-status--live' : 'gm-session-status--scheduled';
        const statusText = s.status === 'live' ? 'LIVE' : 'SCHEDULED';

        return `
          <div class="gm-session-card">
            <div class="gm-session-header">
              <span class="gm-session-game">${s.game}</span>
              <span class="gm-session-status ${statusClass}">${statusText}</span>
            </div>
            <h3 class="gm-session-title">${s.title}</h3>
            ${s.description ? `<p class="gm-session-desc">${s.description}</p>` : ''}
            <div class="gm-session-meta">
              <div class="gm-session-meta-item">
                <span class="gm-session-meta-label">Date</span>
                <span class="gm-session-meta-value">${dateStr}</span>
              </div>
              <div class="gm-session-meta-item">
                <span class="gm-session-meta-label">Time</span>
                <span class="gm-session-meta-value">${timeStr}</span>
              </div>
              <div class="gm-session-meta-item">
                <span class="gm-session-meta-label">Host</span>
                <span class="gm-session-meta-value">${s.host || 'Boogie'}</span>
              </div>
              ${s.max_players ? `
              <div class="gm-session-meta-item">
                <span class="gm-session-meta-label">Slots</span>
                <span class="gm-session-meta-value">${s.max_players} max</span>
              </div>` : ''}
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.warn('Sessions load error:', err);
    }
  }

  // =========================
  // STATS BAR
  // =========================
  async function loadStats() {
    if (!supabase) return;
    try {
      // Squad count
      const { count: squadCount } = await supabase
        .from('gamers')
        .select('*', { count: 'exact', head: true });

      // Online count
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { count: onlineCount } = await supabase
        .from('gamers')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)
        .gte('last_seen', thirtyMinAgo);

      // Active lobbies
      const { count: lobbyCount } = await supabase
        .from('lobby')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Upcoming sessions
      const { count: sessionCount } = await supabase
        .from('gaming_sessions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['scheduled', 'live']);

      const statSquad = document.getElementById('gm-stat-squad');
      const statOnline = document.getElementById('gm-stat-online');
      const statLobbies = document.getElementById('gm-stat-lobbies');
      const statSessions = document.getElementById('gm-stat-sessions');

      if (statSquad) statSquad.textContent = squadCount || 0;
      if (statOnline) statOnline.textContent = onlineCount || 0;
      if (statLobbies) statLobbies.textContent = lobbyCount || 0;
      if (statSessions) statSessions.textContent = sessionCount || 0;
    } catch (err) {
      console.warn('Stats load error:', err);
    }
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
  loadLeaderboard('all');
  loadUpcomingSessions();
  loadStats();
});
