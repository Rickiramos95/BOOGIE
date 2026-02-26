// ============================================
// A BOOGIE WIT DA HOODIE — Landing Page Scripts
// ============================================

// --- Supabase Client ---
const SUPABASE_URL = 'https://voxnxjpwzqlggsznsrdj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveG54anB3enFsZ2dzem5zcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjQ1MDAsImV4cCI6MjA4NzY0MDUwMH0.4Ly0i0tPNw8y6GlLqeVhB-T-E8xfS164dSUEJtxUFb0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
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

  // --- Mailing List Form (Supabase) ---
  const mlForm = document.getElementById('mailing-list-form');
  const mlSubmit = document.getElementById('ml-submit');
  const mlSuccess = document.getElementById('ml-success');
  const mlError = document.getElementById('ml-error');
  const mlErrorMsg = document.getElementById('ml-error-msg');

  mlForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Hide previous messages
    mlSuccess.hidden = true;
    mlError.hidden = true;

    // Disable button while submitting
    const originalText = mlSubmit.textContent;
    mlSubmit.textContent = 'Signing Up...';
    mlSubmit.disabled = true;

    const formData = new FormData(mlForm);
    const subscriber = {
      name: formData.get('name').trim(),
      email: formData.get('email').trim().toLowerCase(),
      phone: formData.get('phone')?.trim() || null,
      zip_code: formData.get('zip_code')?.trim() || null,
    };

    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([subscriber]);

      if (error) {
        // Handle duplicate email
        if (error.code === '23505') {
          mlErrorMsg.textContent = "You're already on the list!";
        } else {
          mlErrorMsg.textContent = 'Something went wrong. Try again.';
          console.error('Supabase error:', error);
        }
        mlError.hidden = false;
        mlSubmit.textContent = originalText;
        mlSubmit.disabled = false;
        return;
      }

      // Success
      mlForm.reset();
      mlSuccess.hidden = false;
      mlSubmit.textContent = 'You\'re In!';
      mlSubmit.style.background = '#7a9a6a';

      setTimeout(() => {
        mlSubmit.textContent = originalText;
        mlSubmit.style.background = '';
        mlSubmit.disabled = false;
        mlSuccess.hidden = true;
      }, 5000);
    } catch (err) {
      console.error('Network error:', err);
      mlErrorMsg.textContent = 'Network error. Check your connection.';
      mlError.hidden = false;
      mlSubmit.textContent = originalText;
      mlSubmit.disabled = false;
    }
  });

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

  // =========================
  // TRACK CATALOG MODULE
  // =========================

  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const musicNoteIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;

  async function loadTrackCatalog() {
    const { data: tracks, error } = await supabase
      .from('tracks')
      .select('*')
      .order('release_year', { ascending: false })
      .order('track_number', { ascending: true });

    if (error) {
      catalogTracks.innerHTML = '<p class="catalog-loading">Failed to load tracks.</p>';
      console.error('Track load error:', error);
      return;
    }

    allTracks = tracks || [];
    renderAlbumFilters(allTracks);
    renderTracks(allTracks);
  }

  function renderAlbumFilters(tracks) {
    const albums = [...new Set(tracks.map(t => t.album))];
    let html = '<button class="catalog-filter active" data-album="all">All Tracks</button>';
    albums.forEach(album => {
      html += `<button class="catalog-filter" data-album="${album}">${album}</button>`;
    });
    catalogFilters.innerHTML = html;

    // Filter click handlers
    catalogFilters.querySelectorAll('.catalog-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        catalogFilters.querySelectorAll('.catalog-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const album = btn.dataset.album;
        if (album === 'all') {
          renderTracks(allTracks);
        } else {
          renderTracks(allTracks.filter(t => t.album === album));
        }
      });
    });
  }

  function renderTracks(tracks) {
    if (!tracks.length) {
      catalogTracks.innerHTML = '<p class="catalog-loading">No tracks found.</p>';
      return;
    }

    const isSignedIn = !!currentUser;
    let html = '';
    tracks.forEach(track => {
      html += `
        <div class="catalog-track" data-track-id="${track.id}" data-album="${track.album}">
          <div class="catalog-track-art">
            ${track.album_art_url
              ? `<img src="${track.album_art_url}" alt="${track.album}">`
              : musicNoteIcon
            }
          </div>
          <div class="catalog-track-info">
            <span class="catalog-track-title">${track.title}</span>
            <span class="catalog-track-meta">${track.album} &middot; ${track.release_year}</span>
          </div>
          <span class="catalog-track-duration">${formatDuration(track.duration_seconds)}</span>
          <div class="catalog-track-links">
            ${track.spotify_url ? `<a href="${track.spotify_url}" target="_blank" class="catalog-link">Spotify</a>` : ''}
            ${track.apple_music_url ? `<a href="${track.apple_music_url}" target="_blank" class="catalog-link">Apple</a>` : ''}
          </div>
          <button class="catalog-track-add" data-track-id="${track.id}" title="Add to playlist" ${isSignedIn ? '' : 'hidden'}>+</button>
        </div>
      `;
    });
    catalogTracks.innerHTML = html;

    // Attach add-to-playlist click handlers
    catalogTracks.querySelectorAll('.catalog-track-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showAtpdDropdown(btn, btn.dataset.trackId);
      });
    });
  }

  // Load catalog on page load (visible to everyone)
  loadTrackCatalog();

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

});
