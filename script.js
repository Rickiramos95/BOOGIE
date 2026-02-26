// ============================================
// A BOOGIE WIT DA HOODIE — Landing Page Scripts
// ============================================

// --- Supabase Client ---
const SUPABASE_URL = 'https://voxnxjpwzqlggsznsrdj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveG54anB3enFsZ2dzem5zcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjQ1MDAsImV4cCI6MjA4NzY0MDUwMH0.4Ly0i0tPNw8y6GlLqeVhB-T-E8xfS164dSUEJtxUFb0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Load track catalog via direct REST API (avoids multiple-client conflicts) ---
(async function loadCatalog() {
  try {
    const catalogEl = document.getElementById('catalog-tracks');
    const filtersEl = document.getElementById('catalog-filters');
    if (!catalogEl) return;

    const res = await fetch(
      SUPABASE_URL + '/rest/v1/tracks?select=*&order=release_year.desc,track_number.asc',
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY } }
    );

    if (!res.ok) throw new Error('Failed to fetch tracks');
    const tracks = await res.json();

    if (!tracks || !tracks.length) {
      catalogEl.innerHTML = '<p class="catalog-empty">No tracks available.</p>';
      return;
    }

    window.__allTracks = tracks;

    // Build album filter chips
    const albums = [...new Set(tracks.map(t => t.album))];
    let chipHtml = '<button class="catalog-chip active" data-album="all">All</button>';
    albums.forEach(a => { chipHtml += '<button class="catalog-chip" data-album="' + a + '">' + a + '</button>'; });
    filtersEl.innerHTML = chipHtml;

    filtersEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.catalog-chip');
      if (!btn) return;
      filtersEl.querySelectorAll('.catalog-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const album = btn.dataset.album;
      renderCatalogTracks(album === 'all' ? tracks : tracks.filter(t => t.album === album));
    });

    renderCatalogTracks(tracks);
  } catch (e) {
    const el = document.getElementById('catalog-tracks');
    if (el) el.innerHTML = '<p class="catalog-empty">Failed to load catalog.</p>';
  }
})();

function renderCatalogTracks(tracks) {
  const el = document.getElementById('catalog-tracks');
  if (!el) return;
  if (!tracks || !tracks.length) { el.innerHTML = '<p class="catalog-empty">No tracks found.</p>'; return; }

  const clockSvg = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/><path d="M8 3.25a.75.75 0 0 1 .75.75v3.69l2.28 2.28a.75.75 0 1 1-1.06 1.06l-2.5-2.5A.75.75 0 0 1 7.25 8V4A.75.75 0 0 1 8 3.25z"/></svg>';
  const playSvg = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg>';
  const noteSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
  const spotifySvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>';
  const appleSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>';

  let html = '<div class="catalog-header"><span class="cat-col-num">#</span><span class="cat-col-title">Title</span><span class="cat-col-album">Album</span><span class="cat-col-dur">' + clockSvg + '</span><span class="cat-col-links"></span></div>';

  tracks.forEach((track, i) => {
    const dur = Math.floor(track.duration_seconds / 60) + ':' + (track.duration_seconds % 60).toString().padStart(2, '0');
    const art = track.album_art_url ? '<img src="' + track.album_art_url + '" alt="' + track.album + '" loading="lazy">' : noteSvg;

    html += '<div class="catalog-track" data-track-id="' + track.id + '" data-album="' + track.album + '">'
      + '<span class="catalog-track-num"><span class="ct-num">' + (i + 1) + '</span><span class="ct-play">' + playSvg + '</span></span>'
      + '<div class="catalog-track-main"><div class="catalog-track-art">' + art + '</div>'
      + '<div class="catalog-track-info"><span class="catalog-track-title">' + track.title + '</span>'
      + '<span class="catalog-track-artist">A Boogie Wit Da Hoodie</span></div></div>'
      + '<span class="catalog-track-album">' + track.album + '</span>'
      + '<span class="catalog-track-duration">' + dur + '</span>'
      + '<div class="catalog-track-links">'
      + (track.spotify_url ? '<a href="' + track.spotify_url + '" target="_blank" class="catalog-link catalog-link-spotify" title="Spotify">' + spotifySvg + '</a>' : '')
      + (track.apple_music_url ? '<a href="' + track.apple_music_url + '" target="_blank" class="catalog-link catalog-link-apple" title="Apple Music">' + appleSvg + '</a>' : '')
      + '</div></div>';
  });

  el.innerHTML = html;
}

// --- Main site scripts ---
(function() {
  // --- Navbar scroll effect ---
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // --- Mobile nav toggle ---
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    navToggle.classList.toggle('active');
  });

  // Close mobile nav when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
    });
  });

  // --- Scroll reveal animation ---
  const revealElements = document.querySelectorAll(
    '.section-title, .section-subtitle, .about-grid, .featured-ep, .fan-favorites, .video-card, .contact-grid, .music-platforms, .mailing-list-inner, .catalog-filters, .catalog-tracks, .playlists-grid'
  );

  revealElements.forEach(el => el.classList.add('reveal'));

  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    document.querySelectorAll('.reveal').forEach(el => {
      const elementTop = el.getBoundingClientRect().top;
      if (elementTop < windowHeight - 80) {
        el.classList.add('visible');
      }
    });
  };

  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll();

  // --- Contact form handler ---
  const contactForm = document.getElementById('contact-form');

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);

    // Placeholder — replace with actual form submission (e.g., Formspree, Netlify Forms)
    console.log('Form submitted:', data);

    const btn = contactForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Message Sent!';
    btn.style.background = '#7a9a6a';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.disabled = false;
      contactForm.reset();
    }, 3000);
  });

  // ============================================
  // AUTH, CATALOG & PLAYLISTS
  // ============================================

  let currentUser = null;
  let allTracks = [];
  let userPlaylists = [];
  let activeDropdownTrackId = null;

  // --- DOM References ---
  const navUser = document.getElementById('nav-user');
  const navUserAvatar = document.getElementById('nav-user-avatar');
  const navUserName = document.getElementById('nav-user-name');
  const navSignoutBtn = document.getElementById('nav-signout-btn');
  const catalogFilters = document.getElementById('catalog-filters');
  const catalogTracks = document.getElementById('catalog-tracks');
  const myPlaylistsSection = document.getElementById('my-playlists');
  const playlistsGrid = document.getElementById('playlists-grid');
  const playlistsEmpty = document.getElementById('playlists-empty');
  const createPlaylistBtn = document.getElementById('create-playlist-btn');
  const playlistFormOverlay = document.getElementById('playlist-form-overlay');
  const playlistFormClose = document.getElementById('playlist-form-close');
  const playlistForm = document.getElementById('playlist-form');
  const playlistFormTitle = document.getElementById('playlist-form-title');
  const playlistFormId = document.getElementById('playlist-form-id');
  const playlistFormName = document.getElementById('playlist-form-name');
  const playlistFormDesc = document.getElementById('playlist-form-desc');
  const playlistFormSubmit = document.getElementById('playlist-form-submit');
  const playlistModalOverlay = document.getElementById('playlist-modal-overlay');
  const playlistModalClose = document.getElementById('playlist-modal-close');
  const playlistModalName = document.getElementById('playlist-modal-name');
  const playlistModalCount = document.getElementById('playlist-modal-count');
  const playlistModalTracks = document.getElementById('playlist-modal-tracks');
  const playlistModalEmpty = document.getElementById('playlist-modal-empty');
  const atpdDropdown = document.getElementById('add-to-playlist-dropdown');
  const atpdList = document.getElementById('atpd-list');
  const atpdNewBtn = document.getElementById('atpd-new-btn');

  // =========================
  // AUTH MODULE
  // =========================

  function signInWithSpotify() {
    supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: { redirectTo: window.location.origin + window.location.pathname }
    });
  }

  function updateNavAuth(displayName, avatarUrl) {
    if (displayName) {
      navUser.hidden = false;
      navUserName.textContent = displayName;
      navUserAvatar.src = avatarUrl || '';
      navUserAvatar.alt = displayName;
      if (!avatarUrl) {
        navUserAvatar.style.display = 'none';
      } else {
        navUserAvatar.style.display = '';
      }
    } else {
      navUser.hidden = true;
    }
  }

  async function handleSignedIn(session) {
    currentUser = session.user;

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', currentUser.id)
      .single();

    const name = profile?.display_name || currentUser.user_metadata?.full_name || 'Fan';
    const avatar = profile?.avatar_url || currentUser.user_metadata?.avatar_url || '';

    updateNavAuth(name, avatar);

    // Show playlists section & add buttons
    myPlaylistsSection.hidden = false;
    document.querySelectorAll('.catalog-track-add').forEach(btn => btn.hidden = false);

    // Load user's playlists
    await loadUserPlaylists();
  }

  function handleSignedOut() {
    currentUser = null;
    updateNavAuth(null, null);

    // Hide playlists & add buttons
    myPlaylistsSection.hidden = true;
    document.querySelectorAll('.catalog-track-add').forEach(btn => btn.hidden = true);
    hideAtpdDropdown();
  }

  // Auth state listener
  try {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      handleSignedIn(session);
    } else if (event === 'SIGNED_OUT') {
      handleSignedOut();
    }
  });

  // Check for existing session on load
  (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      handleSignedIn(session);
    }
  })();

  // Intercept Spotify links — trigger OAuth if not signed in, otherwise open Spotify
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="open.spotify.com"], a[href*="spotify.com"]');
    if (!link) return;

    if (!currentUser) {
      e.preventDefault();
      signInWithSpotify();
    }
    // If signed in, let the link open normally
  });

  navSignoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    handleSignedOut();
  });
  } catch (authErr) {
    console.warn('Auth module init error (non-critical):', authErr);
  }

  // =========================
  // PLAYLIST CRUD MODULE
  // =========================

  async function loadUserPlaylists() {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Playlists load error:', error);
      return;
    }

    userPlaylists = data || [];
    renderPlaylistGrid(userPlaylists);
  }

  function renderPlaylistGrid(playlists) {
    if (!playlists.length) {
      playlistsEmpty.hidden = false;
      playlistsGrid.innerHTML = '';
      return;
    }

    playlistsEmpty.hidden = true;
    let html = '';
    playlists.forEach(pl => {
      html += `
        <div class="playlist-card" data-playlist-id="${pl.id}">
          <div class="playlist-card-art">${musicNoteIcon}</div>
          <div class="playlist-card-name">${pl.name}</div>
          <div class="playlist-card-count">${pl.track_count} track${pl.track_count !== 1 ? 's' : ''}</div>
          <div class="playlist-card-actions">
            <button class="playlist-edit-btn" data-playlist-id="${pl.id}">Edit</button>
            <button class="playlist-delete-btn" data-playlist-id="${pl.id}">Delete</button>
          </div>
        </div>
      `;
    });
    playlistsGrid.innerHTML = html;

    // Click handlers for cards
    playlistsGrid.querySelectorAll('.playlist-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.playlist-card-actions')) return;
        openPlaylistDetail(card.dataset.playlistId);
      });
    });

    // Edit buttons
    playlistsGrid.querySelectorAll('.playlist-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pl = userPlaylists.find(p => p.id === btn.dataset.playlistId);
        if (pl) openPlaylistForm(pl);
      });
    });

    // Delete buttons
    playlistsGrid.querySelectorAll('.playlist-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Delete this playlist?')) return;
        const { error } = await supabase
          .from('playlists')
          .delete()
          .eq('id', btn.dataset.playlistId);
        if (error) {
          showToast('Failed to delete playlist');
        } else {
          showToast('Playlist deleted');
          await loadUserPlaylists();
        }
      });
    });
  }

  // --- Create / Edit Playlist Form ---
  function openPlaylistForm(playlist = null) {
    playlistFormId.value = playlist ? playlist.id : '';
    playlistFormName.value = playlist ? playlist.name : '';
    playlistFormDesc.value = playlist ? (playlist.description || '') : '';
    playlistFormTitle.textContent = playlist ? 'Edit Playlist' : 'Create Playlist';
    playlistFormSubmit.textContent = playlist ? 'Save Changes' : 'Create Playlist';
    playlistFormOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    playlistFormName.focus();
  }

  function closePlaylistForm() {
    playlistFormOverlay.hidden = true;
    document.body.style.overflow = '';
  }

  createPlaylistBtn.addEventListener('click', () => openPlaylistForm());
  playlistFormClose.addEventListener('click', closePlaylistForm);
  playlistFormOverlay.addEventListener('click', (e) => {
    if (e.target === playlistFormOverlay) closePlaylistForm();
  });

  playlistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const name = playlistFormName.value.trim();
    const description = playlistFormDesc.value.trim() || null;
    const existingId = playlistFormId.value;

    if (!name) return;

    playlistFormSubmit.disabled = true;
    playlistFormSubmit.textContent = 'Saving...';

    if (existingId) {
      // Update
      const { error } = await supabase
        .from('playlists')
        .update({ name, description, updated_at: new Date().toISOString() })
        .eq('id', existingId);
      if (error) {
        showToast('Failed to update playlist');
      } else {
        showToast('Playlist updated');
      }
    } else {
      // Create
      const { error } = await supabase
        .from('playlists')
        .insert([{ user_id: currentUser.id, name, description }]);
      if (error) {
        showToast('Failed to create playlist');
      } else {
        showToast('Playlist created!');
      }
    }

    playlistFormSubmit.disabled = false;
    closePlaylistForm();
    await loadUserPlaylists();
  });

  // --- Playlist Detail Modal ---
  async function openPlaylistDetail(playlistId) {
    const pl = userPlaylists.find(p => p.id === playlistId);
    if (!pl) return;

    playlistModalName.textContent = pl.name;
    playlistModalCount.textContent = `${pl.track_count} track${pl.track_count !== 1 ? 's' : ''}`;
    playlistModalTracks.innerHTML = '';
    playlistModalEmpty.hidden = true;
    playlistModalOverlay.hidden = false;
    document.body.style.overflow = 'hidden';

    // Fetch tracks in this playlist
    const { data, error } = await supabase
      .from('playlist_tracks')
      .select('id, position, track_id, tracks(title, album, album_art_url, duration_seconds)')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (error || !data || !data.length) {
      playlistModalEmpty.hidden = false;
      return;
    }

    let html = '';
    data.forEach(pt => {
      const t = pt.tracks;
      html += `
        <li class="pmt-item" data-pt-id="${pt.id}">
          <div class="pmt-art">
            ${t.album_art_url
              ? `<img src="${t.album_art_url}" alt="${t.album}">`
              : musicNoteIcon
            }
          </div>
          <div class="pmt-info">
            <div class="pmt-title">${t.title}</div>
            <div class="pmt-album">${t.album}</div>
          </div>
          <span class="pmt-duration">${formatDuration(t.duration_seconds)}</span>
          <button class="pmt-remove" data-pt-id="${pt.id}" data-playlist-id="${playlistId}" title="Remove">&times;</button>
        </li>
      `;
    });
    playlistModalTracks.innerHTML = html;

    // Remove track handlers
    playlistModalTracks.querySelectorAll('.pmt-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { error } = await supabase
          .from('playlist_tracks')
          .delete()
          .eq('id', btn.dataset.ptId);
        if (error) {
          showToast('Failed to remove track');
        } else {
          showToast('Track removed');
          await loadUserPlaylists();
          openPlaylistDetail(btn.dataset.playlistId);
        }
      });
    });
  }

  playlistModalClose.addEventListener('click', () => {
    playlistModalOverlay.hidden = true;
    document.body.style.overflow = '';
  });
  playlistModalOverlay.addEventListener('click', (e) => {
    if (e.target === playlistModalOverlay) {
      playlistModalOverlay.hidden = true;
      document.body.style.overflow = '';
    }
  });

  // --- Add to Playlist Dropdown ---
  function showAtpdDropdown(anchorBtn, trackId) {
    activeDropdownTrackId = trackId;

    // Populate list
    atpdList.innerHTML = '';
    if (!userPlaylists.length) {
      atpdList.innerHTML = '<li class="atpd-item" style="color:var(--text-muted);cursor:default;">No playlists yet</li>';
    } else {
      userPlaylists.forEach(pl => {
        const li = document.createElement('li');
        li.className = 'atpd-item';
        li.textContent = pl.name;
        li.dataset.playlistId = pl.id;
        li.addEventListener('click', () => {
          addTrackToPlaylist(pl.id, trackId);
          hideAtpdDropdown();
        });
        atpdList.appendChild(li);
      });
    }

    // Position dropdown near button
    const rect = anchorBtn.getBoundingClientRect();
    atpdDropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;
    atpdDropdown.style.left = `${rect.left + window.scrollX - 180}px`;
    atpdDropdown.hidden = false;
  }

  function hideAtpdDropdown() {
    atpdDropdown.hidden = true;
    activeDropdownTrackId = null;
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!atpdDropdown.hidden && !atpdDropdown.contains(e.target) && !e.target.classList.contains('catalog-track-add')) {
      hideAtpdDropdown();
    }
  });

  atpdNewBtn.addEventListener('click', () => {
    hideAtpdDropdown();
    openPlaylistForm();
  });

  async function addTrackToPlaylist(playlistId, trackId) {
    // Get next position
    const { data: existing } = await supabase
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPos = (existing && existing.length > 0) ? existing[0].position + 1 : 0;

    const { error } = await supabase
      .from('playlist_tracks')
      .insert([{ playlist_id: playlistId, track_id: trackId, position: nextPos }]);

    if (error) {
      if (error.code === '23505') {
        showToast('Track already in playlist');
      } else {
        showToast('Failed to add track');
        console.error('Add track error:', error);
      }
    } else {
      showToast('Track added!');
      await loadUserPlaylists();
    }
  }

  // =========================
  // TOAST NOTIFICATION
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

})();
