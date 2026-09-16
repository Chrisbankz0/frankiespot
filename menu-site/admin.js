/* =====================================================================
   FRANKIES POT — STAFF DASHBOARD
   Handles login, loads orders from Supabase, and shows sales totals,
   best-sellers, and a per-order cancel action.

   You shouldn't need to edit this file. Staff accounts are created in
   Supabase itself: Dashboard -> Authentication -> Users -> Add user.
   ===================================================================== */

(function () {
  "use strict";

  const el = (id) => document.getElementById(id);

  if (typeof supabase === "undefined" || typeof SUPABASE_URL === "undefined") {
    document.body.innerHTML =
      '<p style="padding:40px;font-family:sans-serif;">' +
      "Couldn't load the database connection. Check that supabase-config.js " +
      "is present and that the Supabase script tag loaded (check your internet " +
      "connection, then reload)." +
      "</p>";
    return;
  }

  const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const money = (n) => "₦" + Number(n || 0).toLocaleString("en-NG");

  /* Site development repayment — 3% of every completed (non-cancelled)
     order, all-time, until this reaches the agreed total. Change these
     two numbers if the terms ever change, or once it's fully repaid. */
  const REPAYMENT_RATE = 0.03;
  const REPAYMENT_GOAL = 1000000;

  const loginView = el("loginView");
  const dashView = el("dashView");
  const loginForm = el("loginForm");
  const loginError = el("loginError");
  const loginBtn = el("loginBtn");

  let currentRange = "today";
  let allOrders = []; // orders for the currently selected range

  /* ------------------------------------------------------------------
     Auth
     ------------------------------------------------------------------ */

  async function checkSession() {
    const { data } = await db.auth.getSession();
    if (data.session) {
      showDashboard(data.session);
    } else {
      showLogin();
    }
  }

  function showLogin() {
    loginView.style.display = "";
    dashView.style.display = "none";
  }

  function showDashboard(session) {
    loginView.style.display = "none";
    dashView.style.display = "";
    el("whoAmI").textContent = "Logged in as " + session.user.email;
    loadOrders();
    loadRepaymentProgress();
  }

  async function loadRepaymentProgress() {
    /* All-time, no date filter — this is a running total, not tied to
       the Today/Week/Month view above it. */
    const [ordersRes, paymentsRes] = await Promise.all([
      db.from("orders").select("total, status"),
      db.from("repayments").select("*").order("created_at", { ascending: false }),
    ]);

    if (ordersRes.error) console.error("Couldn't load orders for repayment:", ordersRes.error);
    if (paymentsRes.error) console.error("Couldn't load repayments:", paymentsRes.error);

    const lifetimeSales = (ordersRes.data || [])
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const earned = Math.round(lifetimeSales * REPAYMENT_RATE);

    const payments = paymentsRes.data || [];
    const paid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const outstanding = Math.max(0, earned - paid);

    /* The ₦1M finish line is about money actually in hand, not just
       what's accrued on paper — so the bar tracks "paid," not "earned." */
    const pct = Math.min(100, (paid / REPAYMENT_GOAL) * 100);

    el("repayEarned").textContent = money(earned);
    el("repayPaid").textContent = money(paid);
    el("repayOutstanding").textContent = money(outstanding);
    el("repayFill").style.width = pct.toFixed(1) + "%";

    if (paid >= REPAYMENT_GOAL) {
      el("repayAmount").textContent = `Fully repaid — ${money(paid)} paid 🎉`;
      el("repayCard").classList.add("is-complete");
    } else {
      el("repayAmount").textContent = `${money(paid)} of ${money(REPAYMENT_GOAL)} paid`;
      el("repayCard").classList.remove("is-complete");
    }

    renderPaymentsList(payments);
  }

  function renderPaymentsList(payments) {
    const wrap = el("paymentsList");
    if (!payments.length) {
      wrap.innerHTML = '<p class="dash-empty">No payments logged yet.</p>';
      return;
    }
    wrap.innerHTML = "";
    payments.slice(0, 8).forEach((p) => {
      const row = document.createElement("div");
      row.className = "payment-row";

      const date = new Date(p.created_at).toLocaleDateString("en-NG", {
        day: "numeric", month: "short", year: "numeric",
      });

      const info = document.createElement("div");
      info.className = "payment-info";
      info.innerHTML =
        `<span class="payment-amount">${money(p.amount)}</span>` +
        `<span class="payment-date">${escapeHtml(date)}${p.note ? " · " + escapeHtml(p.note) : ""}</span>`;
      row.appendChild(info);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "payment-delete-btn";
      del.textContent = "Remove";
      del.onclick = () => deletePayment(p.id);
      row.appendChild(del);

      wrap.appendChild(row);
    });
  }

  async function deletePayment(id) {
    if (!window.confirm("Remove this payment record? This can't be undone.")) return;
    const { error } = await db.from("repayments").delete().eq("id", id);
    if (error) {
      window.alert("Couldn't remove it: " + error.message);
      return;
    }
    loadRepaymentProgress();
  }

  el("paymentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = Number(el("paymentAmount").value);
    const note = el("paymentNote").value.trim();
    if (!amount || amount <= 0) return;

    const { error } = await db.from("repayments").insert({ amount, note: note || null });
    if (error) {
      window.alert("Couldn't log that payment: " + error.message);
      return;
    }
    el("paymentAmount").value = "";
    el("paymentNote").value = "";
    loadRepaymentProgress();
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.style.display = "none";
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in…";

    const email = el("loginEmail").value.trim();
    const password = el("loginPassword").value;

    const { data, error } = await db.auth.signInWithPassword({ email, password });

    loginBtn.disabled = false;
    loginBtn.textContent = "Log in";

    if (error) {
      loginError.textContent = "Couldn't log in — check your email and password.";
      loginError.style.display = "";
      return;
    }
    showDashboard(data.session);
  });

  el("logoutBtn").onclick = async () => {
    await db.auth.signOut();
    showLogin();
  };

  el("refreshBtn").onclick = () => {
    loadOrders();
    loadRepaymentProgress();
  };

  /* Keep the numbers current during a shift without anyone needing to
     remember to reload — quiet background refresh, no visual fuss. */
  setInterval(() => {
    if (dashView.style.display !== "none") {
      loadOrders();
      loadRepaymentProgress();
    }
  }, 30000);

  /* ------------------------------------------------------------------
     Date ranges — plain calendar day / week (Mon-Sun) / month, using
     the device's local time (staff are all in the same timezone as
     the business, so this needs no extra conversion).
     ------------------------------------------------------------------ */

  function rangeStart(range) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (range === "today") return start;
    if (range === "week") {
      const day = start.getDay(); // 0 = Sunday
      const diffToMonday = (day + 6) % 7;
      start.setDate(start.getDate() - diffToMonday);
      return start;
    }
    if (range === "month") {
      start.setDate(1);
      return start;
    }
    return start;
  }

  el("rangeTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".range-tab");
    if (!btn) return;
    document.querySelectorAll(".range-tab").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    currentRange = btn.dataset.range;
    loadOrders();
  });

  /* ------------------------------------------------------------------
     Load + render
     ------------------------------------------------------------------ */

  async function loadOrders() {
    const start = rangeStart(currentRange);
    const { data, error } = await db
      .from("orders")
      .select("*")
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      el("ordersList").innerHTML =
        '<p class="dash-empty">Couldn\'t load orders: ' + error.message + "</p>";
      return;
    }

    allOrders = data || [];
    renderStats();
    renderBestSellers();
    renderOrdersList();
  }

  function renderStats() {
    const active = allOrders.filter((o) => o.status !== "cancelled");
    const sales = active.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const count = active.length;
    const avg = count ? Math.round(sales / count) : 0;

    el("statSales").textContent = money(sales);
    el("statOrders").textContent = count;
    el("statAvg").textContent = money(avg);
  }

  function renderBestSellers() {
    const active = allOrders.filter((o) => o.status !== "cancelled");
    const counts = new Map();
    active.forEach((o) => {
      (o.items || []).forEach((item) => {
        counts.set(item.name, (counts.get(item.name) || 0) + Number(item.qty || 0));
      });
    });

    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const list = el("bestsellers");

    if (sorted.length === 0) {
      list.innerHTML = '<p class="dash-empty">No sales in this range yet.</p>';
      return;
    }

    list.innerHTML = sorted
      .map(
        ([name, qty]) =>
          `<li><span class="bs-name">${escapeHtml(name)}</span><span class="bs-qty">${qty}×</span></li>`
      )
      .join("");
  }

  function renderOrdersList() {
    const wrap = el("ordersList");

    if (allOrders.length === 0) {
      wrap.innerHTML = '<p class="dash-empty">No orders in this range yet.</p>';
      return;
    }

    wrap.innerHTML = "";
    allOrders.forEach((o) => {
      const row = document.createElement("div");
      row.className = "order-row" + (o.status === "cancelled" ? " is-cancelled" : "");

      const time = new Date(o.created_at).toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });

      const itemSummary =
        (o.items || []).map((i) => `${i.qty}× ${i.name}`).join(", ") ||
        (o.custom_note ? "Custom order" : "—");

      const info = document.createElement("div");
      info.className = "order-info";
      info.innerHTML =
        `<div class="order-time">${escapeHtml(time)}</div>` +
        `<div class="order-items">${escapeHtml(itemSummary)}</div>` +
        (o.custom_note
          ? `<div class="order-custom">“${escapeHtml(o.custom_note)}”</div>`
          : "") +
        (o.customer_name || o.customer_phone || o.customer_address
          ? `<div class="order-customer">` +
              `${escapeHtml(o.customer_name || "—")} · ${escapeHtml(o.customer_phone || "—")}` +
              `<br>${escapeHtml(o.customer_address || "—")}` +
              (o.preferred_time ? ` · ${escapeHtml(o.preferred_time)}` : "") +
            `</div>`
          : "") +
        (o.status === "cancelled"
          ? `<div class="order-cancel-reason">Cancelled: ${escapeHtml(o.cancel_reason || "no reason given")}</div>`
          : "");
      row.appendChild(info);

      const right = document.createElement("div");
      right.className = "order-right";
      right.innerHTML = `<div class="order-total">${money(o.total)}</div>`;

      if (o.status !== "cancelled") {
        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "order-cancel-btn";
        cancelBtn.textContent = "Cancel";
        cancelBtn.onclick = () => cancelOrder(o.id);
        right.appendChild(cancelBtn);
      }

      row.appendChild(right);
      wrap.appendChild(row);
    });
  }

  async function cancelOrder(id) {
    const reason = window.prompt(
      "Why is this order being cancelled? (shown on the dashboard, e.g. \"customer no-show\", \"out of stock\")"
    );
    if (reason === null) return; // they hit Cancel on the prompt itself
    if (!reason.trim()) {
      window.alert("Please enter a reason — this keeps the record honest.");
      return;
    }

    const { error } = await db
      .from("orders")
      .update({
        status: "cancelled",
        cancel_reason: reason.trim(),
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      window.alert("Couldn't cancel this order: " + error.message);
      return;
    }
    loadOrders();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  checkSession();
})();