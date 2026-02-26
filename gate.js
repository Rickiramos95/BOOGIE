// ============================================
// Entry Gate — "Join The Hoodie Gang"
// Shared gate logic for index.html & gaming.html
// ============================================

(function () {
  const SUPABASE_URL = 'https://voxnxjpwzqlggsznsrdj.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveG54anB3enFsZ2dzem5zcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjQ1MDAsImV4cCI6MjA4NzY0MDUwMH0.4Ly0i0tPNw8y6GlLqeVhB-T-E8xfS164dSUEJtxUFb0';
  const STORAGE_KEY = 'hoodie_subscriber_id';
  const PAGE_ID = window.location.pathname.includes('gaming') ? 'gaming' : 'index';

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let currentVisitId = null;
  let visitStartTime = Date.now();
  let heartbeatInterval = null;

  // --- Inject gate overlay HTML ---
  function injectGate() {
    const gate = document.createElement('div');
    gate.id = 'hoodie-gate';
    gate.className = 'hoodie-gate';
    gate.style.display = 'none';
    gate.innerHTML = `
      <div class="hoodie-gate-card">
        <div class="hoodie-gate-badge">Exclusive Access</div>
        <h2 class="hoodie-gate-title">Join The Hoodie Gang</h2>
        <p class="hoodie-gate-desc">
          Enter your info to unlock exclusive content, tour dates, merch drops, and more.
        </p>
        <form id="hoodie-gate-form" class="hoodie-gate-form">
          <div class="hoodie-gate-row">
            <div class="form-group">
              <input type="text" name="first_name" placeholder="First Name" required autocomplete="given-name">
            </div>
            <div class="form-group">
              <input type="text" name="last_name" placeholder="Last Name" required autocomplete="family-name">
            </div>
          </div>
          <div class="form-group">
            <input type="email" name="email" placeholder="Email Address" required autocomplete="email">
          </div>
          <button type="submit" class="hoodie-gate-submit" id="hoodie-gate-submit">
            Enter The Site
          </button>
          <p class="hoodie-gate-disclaimer">We respect your privacy. Unsubscribe anytime.</p>
        </form>
        <div class="hoodie-gate-error" id="hoodie-gate-error" hidden>
          <p id="hoodie-gate-error-msg"></p>
        </div>
      </div>
    `;
    document.body.prepend(gate);
  }

  // --- Show gate ---
  function showGate() {
    const gate = document.getElementById('hoodie-gate');
    gate.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // --- Hide gate with fade ---
  function hideGate() {
    const gate = document.getElementById('hoodie-gate');
    if (!gate) return;
    gate.classList.add('hiding');
    setTimeout(() => {
      gate.style.display = 'none';
      document.body.style.overflow = '';
    }, 500);
  }

  // --- Log a visit ---
  async function logVisit(subscriberId) {
    visitStartTime = Date.now();
    const { data } = await sb
      .from('visits')
      .insert([{ subscriber_id: subscriberId, page: PAGE_ID }])
      .select('id')
      .single();

    if (data) {
      currentVisitId = data.id;
      startHeartbeat();
    }
  }

  // --- Update visit duration ---
  async function updateDuration() {
    if (!currentVisitId) return;
    const durationSec = Math.round((Date.now() - visitStartTime) / 1000);
    try {
      await sb
        .from('visits')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: durationSec,
        })
        .eq('id', currentVisitId);
    } catch (e) {
      // Silently fail — duration tracking is non-critical
    }
  }

  // --- Heartbeat: update duration every 30s ---
  function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(updateDuration, 30000);
  }

  // --- Duration tracking events ---
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') updateDuration();
  });
  window.addEventListener('beforeunload', () => updateDuration());

  // --- Handle form submission ---
  function setupForm() {
    const form = document.getElementById('hoodie-gate-form');
    const submitBtn = document.getElementById('hoodie-gate-submit');
    const errorDiv = document.getElementById('hoodie-gate-error');
    const errorMsg = document.getElementById('hoodie-gate-error-msg');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorDiv.hidden = true;

      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Loading...';
      submitBtn.disabled = true;

      const formData = new FormData(form);
      const firstName = formData.get('first_name').trim();
      const lastName = formData.get('last_name').trim();
      const email = formData.get('email').trim().toLowerCase();

      try {
        // Try to insert new subscriber
        const { data, error } = await sb
          .from('subscribers')
          .insert([{
            first_name: firstName,
            last_name: lastName,
            name: firstName + ' ' + lastName,
            email: email,
          }])
          .select('id')
          .single();

        if (error) {
          // Duplicate email — look up existing subscriber
          if (error.code === '23505') {
            const { data: existing } = await sb
              .from('subscribers')
              .select('id')
              .eq('email', email)
              .single();

            if (existing) {
              localStorage.setItem(STORAGE_KEY, existing.id);
              await logVisit(existing.id);
              hideGate();
              return;
            }
          }
          // Other error
          errorMsg.textContent = 'Something went wrong. Try again.';
          errorDiv.hidden = false;
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          return;
        }

        // Success — new subscriber
        localStorage.setItem(STORAGE_KEY, data.id);
        await logVisit(data.id);
        hideGate();
      } catch (err) {
        errorMsg.textContent = 'Network error. Check your connection.';
        errorDiv.hidden = false;
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // --- Init ---
  async function init() {
    injectGate();
    setupForm();

    const storedId = localStorage.getItem(STORAGE_KEY);

    if (storedId) {
      // Returning visitor — verify they exist
      const { data } = await sb
        .from('subscribers')
        .select('id')
        .eq('id', storedId)
        .single();

      if (data) {
        // Valid subscriber — don't show gate, just log visit
        await logVisit(data.id);
        return;
      }

      // Invalid ID — clear and show gate
      localStorage.removeItem(STORAGE_KEY);
    }

    // New visitor — show gate
    showGate();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
