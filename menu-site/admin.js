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
    loadSoldOutStatus();
    loadTrendChart();
    loadBusyStatus();
    populateCategoryDropdown();
    loadCustomItems();
    setUpStaffPushOptIn();
  }

  async function loadBusyStatus() {
    const { data, error } = await db.from("site_status").select("busy").eq("id", 1);
    if (error || !data || !data[0]) return;
    el("busyToggle").checked = !!data[0].busy;
  }

  el("busyToggle").addEventListener("change", async (e) => {
    const busy = e.target.checked;
    const { error } = await db.from("site_status").update({ busy }).eq("id", 1);
    if (error) {
      window.alert("Couldn't update: " + error.message);
      e.target.checked = !busy; // revert the visual toggle
    }
  });

  el("notifyOpenBtn").addEventListener("click", async () => {
    if (
      !window.confirm(
        "Send a push notification to everyone who opted in for \"we're open\" alerts?"
      )
    ) {
      return;
    }

    const btn = el("notifyOpenBtn");
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = "Sending…";

    try {
      const { data: sessionData } = await db.auth.getSession();
      const accessToken = sessionData.session && sessionData.session.access_token;
      if (!accessToken) {
        window.alert("You're not logged in — please refresh and log in again.");
        return;
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-open`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();

      if (!res.ok) {
        window.alert("Couldn't send notifications: " + (result.error || res.statusText));
        return;
      }

      window.alert(`Notified ${result.sent} customer${result.sent === 1 ? "" : "s"}.`);
    } catch (err) {
      window.alert("Couldn't send notifications: " + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  /* ------------------------------------------------------------------
     Staff push opt-in — "Notify me when a new order comes in". Mirrors
     the customer-facing opt-in in app.js, but subscribes into
     staff_push_subscriptions (authenticated-only) instead, and is
     triggered by every new order rather than by a dashboard button —
     see notifyStaffOfNewOrder in app.js and the notify-new-order
     Edge Function.
     ------------------------------------------------------------------ */

  function setUpStaffPushOptIn() {
    const btn = el("staffNotifyOptInBtn");
    if (!btn) return;

    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      typeof VAPID_PUBLIC_KEY !== "undefined" &&
      VAPID_PUBLIC_KEY;

    if (
      !supported ||
      localStorage.getItem("fp_staff_push_subscribed") === "1" ||
      Notification.permission === "denied"
    ) {
      btn.style.display = "none";
      return;
    }

    btn.style.display = "";

    function urlBase64ToUint8Array(base64String) {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
      const raw = window.atob(base64);
      return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
    }

    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = "Setting up…";

      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          btn.style.display = "none";
          return;
        }

        await navigator.serviceWorker.register("sw.js");
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const { error } = await db
          .from("staff_push_subscriptions")
          .insert({ subscription: subscription.toJSON() });
        if (error) throw error;

        localStorage.setItem("fp_staff_push_subscribed", "1");
        btn.textContent = "🔔 You'll be notified";
        setTimeout(() => {
          btn.style.display = "none";
        }, 1500);
      } catch (err) {
        console.error("Couldn't set up notifications:", err);
        btn.disabled = false;
        btn.textContent = originalText;
        window.alert("Couldn't turn on notifications — please try again.");
      }
    });
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
    loadTrendChart();
  };

  /* Keep the numbers current during a shift without anyone needing to
     remember to reload — quiet background refresh, no visual fuss. */
  setInterval(() => {
    if (dashView.style.display !== "none") {
      loadOrders();
      loadRepaymentProgress();
      loadTrendChart();
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

  /* ------------------------------------------------------------------
     Menu availability — mark a dish sold out (or back in stock)
     instantly, without touching menu.js or redeploying anything.
     ------------------------------------------------------------------ */

  let soldOutSet = new Set();
  let archivedSet = new Set();
  let bestsellerSet = new Set();

  let priceOverrides = new Map(); // item name -> price set from the dashboard

  /* Items added from the "Add a menu item" form below, merged into
     Menu availability under their own category rather than kept in a
     separate list — see buildCustomRow / renderMenuAvailability. */
  let customItems = [];

  async function loadSoldOutStatus() {
    const [soldOutRes, archivedRes, priceRes, bestsellerRes] = await Promise.all([
      db.from("sold_out_items").select("item_name"),
      db.from("archived_items").select("item_name"),
      db.from("price_overrides").select("item_name, price"),
      db.from("bestseller_overrides").select("item_name"),
    ]);
    if (soldOutRes.error) console.error("Couldn't load sold-out status:", soldOutRes.error);
    if (archivedRes.error) console.error("Couldn't load archived status:", archivedRes.error);
    if (priceRes.error) console.error("Couldn't load price overrides:", priceRes.error);
    if (bestsellerRes.error) console.error("Couldn't load bestseller overrides:", bestsellerRes.error);
    soldOutSet = new Set((soldOutRes.data || []).map((r) => r.item_name));
    archivedSet = new Set((archivedRes.data || []).map((r) => r.item_name));
    priceOverrides = new Map((priceRes.data || []).map((r) => [r.item_name, Number(r.price)]));
    bestsellerSet = new Set((bestsellerRes.data || []).map((r) => r.item_name));
    renderMenuAvailability(el("availSearch").value);
  }

  function sameCategory(a, b) {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }

  /* Shared price-input-plus-buttons control, used by both native
     menu.js rows and dashboard-added rows — only what happens on save
     (and whether there's a "reset" option) differs between the two. */
  function buildPriceEditor(itemName, currentPrice, onSave, resetTo) {
    const priceWrap = document.createElement("div");
    priceWrap.className = "avail-price";

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.className = "field-input avail-price-input";
    input.value = currentPrice;
    input.setAttribute("aria-label", "Price for " + itemName);
    priceWrap.appendChild(input);

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "avail-toggle";
    saveBtn.textContent = "Save price";
    saveBtn.onclick = () => onSave(Number(input.value));
    priceWrap.appendChild(saveBtn);

    if (resetTo != null) {
      const resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "avail-toggle";
      resetBtn.textContent = "Reset to " + money(resetTo);
      resetBtn.onclick = () => savePrice(itemName, resetTo, resetTo);
      priceWrap.appendChild(resetBtn);
    }

    return priceWrap;
  }

  function buildNativeRow(item) {
    /* soldOut set directly in menu.js can't be undone from here —
       that's a code-level decision, this toggle is only for the
       database-level override on top of it. */
    const hardCoded = !!item.soldOut;
    const isOut = hardCoded || soldOutSet.has(item.name);
    const isArchived = archivedSet.has(item.name);

    const row = document.createElement("div");
    row.className =
      "avail-row" + (isOut ? " is-out" : "") + (isArchived ? " is-archived" : "");

    const name = document.createElement("span");
    name.className = "avail-name";
    name.textContent = item.name + (isArchived ? " (archived)" : "");
    row.appendChild(name);

    /* Price editor — only for plain-priced items (dishes with size
       options carry a price per size, which isn't editable here). */
    if (!(item.sizes && item.sizes.length)) {
      const overridden = priceOverrides.has(item.name);
      const current = overridden ? priceOverrides.get(item.name) : item.price;
      row.appendChild(
        buildPriceEditor(
          item.name,
          current,
          (price) => savePrice(item.name, item.price, price),
          overridden ? item.price : null
        )
      );
    }

    const actions = document.createElement("div");
    actions.className = "avail-actions";

    /* Bestseller set directly in menu.js can't be undone from here,
       same reasoning as the sold-out flag above. */
    const hardCodedBestseller = !!item.popular;
    const isBestseller = hardCodedBestseller || bestsellerSet.has(item.name);
    const bestsellerBtn = document.createElement("button");
    bestsellerBtn.type = "button";
    bestsellerBtn.className = "avail-toggle";
    if (hardCodedBestseller) {
      bestsellerBtn.textContent = "Bestseller in menu.js";
      bestsellerBtn.disabled = true;
    } else {
      bestsellerBtn.textContent = isBestseller ? "Remove from Bestsellers" : "Mark as Bestseller";
      bestsellerBtn.onclick = () => toggleBestseller(item.name, isBestseller);
    }
    actions.appendChild(bestsellerBtn);

    /* Sold-out doesn't make sense to offer once something's already
       archived — it's already fully hidden either way. */
    if (!isArchived) {
      const soldOutBtn = document.createElement("button");
      soldOutBtn.type = "button";
      soldOutBtn.className = "avail-toggle";
      if (hardCoded) {
        soldOutBtn.textContent = "Set sold out in menu.js";
        soldOutBtn.disabled = true;
      } else {
        soldOutBtn.textContent = isOut ? "Mark available" : "Mark sold out";
        soldOutBtn.onclick = () => toggleSoldOut(item.name, isOut);
      }
      actions.appendChild(soldOutBtn);
    }

    const archiveBtn = document.createElement("button");
    archiveBtn.type = "button";
    archiveBtn.className = "avail-toggle avail-archive-btn";
    archiveBtn.textContent = isArchived ? "Unarchive" : "Archive";
    archiveBtn.onclick = () => toggleArchive(item.name, isArchived);
    actions.appendChild(archiveBtn);

    row.appendChild(actions);
    return row;
  }

  /* A row for an item added via "Add a menu item" below. Its sold-out
     flag and price live directly on its own custom_menu_items row
     (there's no menu.js copy to fall back to), and "Remove" replaces
     Archive since deleting it outright is meaningful here in a way it
     isn't for a hardcoded item. */
  function buildCustomRow(row) {
    const isOut = !!row.sold_out;

    const el = document.createElement("div");
    el.className = "avail-row" + (isOut ? " is-out" : "");

    const name = document.createElement("span");
    name.className = "avail-name";
    name.textContent = row.name;
    el.appendChild(name);

    el.appendChild(
      buildPriceEditor(row.name, row.price, (price) => saveCustomPrice(row, price), null)
    );

    const actions = document.createElement("div");
    actions.className = "avail-actions";

    const isBestseller = !!row.popular;
    const bestsellerBtn = document.createElement("button");
    bestsellerBtn.type = "button";
    bestsellerBtn.className = "avail-toggle";
    bestsellerBtn.textContent = isBestseller ? "Remove from Bestsellers" : "Mark as Bestseller";
    bestsellerBtn.onclick = () => toggleCustomBestseller(row, isBestseller);
    actions.appendChild(bestsellerBtn);

    const soldOutBtn = document.createElement("button");
    soldOutBtn.type = "button";
    soldOutBtn.className = "avail-toggle";
    soldOutBtn.textContent = isOut ? "Mark available" : "Mark sold out";
    soldOutBtn.onclick = () => toggleCustomSoldOut(row, isOut);
    actions.appendChild(soldOutBtn);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "avail-toggle avail-archive-btn";
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => removeCustomItem(row);
    actions.appendChild(removeBtn);

    el.appendChild(actions);
    return el;
  }

  function renderMenuAvailability(filterText) {
    const wrap = el("menuAvailability");
    const q = (filterText || "").trim().toLowerCase();
    wrap.innerHTML = "";

    if (typeof MENU === "undefined") {
      wrap.innerHTML = '<p class="dash-empty">menu.js didn\'t load — can\'t list items.</p>';
      return;
    }

    function renderCategory(categoryName, nativeItems, customRows) {
      const items = q ? nativeItems.filter((i) => i.name.toLowerCase().includes(q)) : nativeItems;
      const custom = q ? customRows.filter((r) => r.name.toLowerCase().includes(q)) : customRows;
      if (!items.length && !custom.length) return;

      const catHead = document.createElement("h3");
      catHead.className = "avail-cat";
      catHead.textContent = categoryName;
      wrap.appendChild(catHead);

      items.forEach((item) => wrap.appendChild(buildNativeRow(item)));
      custom.forEach((row) => wrap.appendChild(buildCustomRow(row)));
    }

    const seenCategories = new Set();

    MENU.forEach((group) => {
      seenCategories.add(group.category.trim().toLowerCase());
      const customForGroup = customItems.filter((row) => sameCategory(row.category, group.category));
      renderCategory(group.category, group.items, customForGroup);
    });

    /* Categories that only exist because they were created from the
       dashboard (like a brand-new "Breakfast" section) — no menu.js
       items of their own, just whatever's been added this way. */
    const extraCategories = [];
    customItems.forEach((row) => {
      const key = row.category.trim().toLowerCase();
      if (seenCategories.has(key)) return;
      seenCategories.add(key);
      extraCategories.push(row.category);
    });
    extraCategories.forEach((categoryName) => {
      const customForGroup = customItems.filter((row) => sameCategory(row.category, categoryName));
      renderCategory(categoryName, [], customForGroup);
    });
  }

  async function savePrice(name, basePrice, price) {
    if (!price || price <= 0) {
      window.alert("Enter a price greater than 0.");
      return;
    }
    /* Back to the menu.js price means no override is needed. */
    const { error } =
      price === basePrice
        ? await db.from("price_overrides").delete().eq("item_name", name)
        : await db.from("price_overrides").upsert({ item_name: name, price });
    if (error) {
      window.alert("Couldn't save the price: " + error.message);
      return;
    }
    loadSoldOutStatus();
  }

  async function saveCustomPrice(row, price) {
    if (!price || price <= 0) {
      window.alert("Enter a price greater than 0.");
      return;
    }
    const { error } = await db.from("custom_menu_items").update({ price }).eq("id", row.id);
    if (error) {
      window.alert("Couldn't update the price: " + error.message);
      return;
    }
    loadCustomItems();
  }

  async function toggleCustomSoldOut(row, currentlyOut) {
    const { error } = await db
      .from("custom_menu_items")
      .update({ sold_out: !currentlyOut })
      .eq("id", row.id);
    if (error) {
      window.alert("Couldn't update it: " + error.message);
      return;
    }
    loadCustomItems();
  }

  async function removeCustomItem(row) {
    if (!window.confirm(`Remove "${row.name}" from the menu?`)) return;
    const { error } = await db.from("custom_menu_items").delete().eq("id", row.id);
    if (error) {
      window.alert("Couldn't remove it: " + error.message);
      return;
    }
    populateCategoryDropdown();
    loadCustomItems();
  }

  async function toggleCustomBestseller(row, currentlyOn) {
    const { error } = await db
      .from("custom_menu_items")
      .update({ popular: !currentlyOn })
      .eq("id", row.id);
    if (error) {
      window.alert("Couldn't update it: " + error.message);
      return;
    }
    loadCustomItems();
  }

  async function toggleBestseller(name, currentlyOn) {
    if (currentlyOn) {
      const { error } = await db.from("bestseller_overrides").delete().eq("item_name", name);
      if (error) {
        window.alert("Couldn't remove it from Bestsellers: " + error.message);
        return;
      }
    } else {
      const { error } = await db.from("bestseller_overrides").insert({ item_name: name });
      if (error) {
        window.alert("Couldn't mark it as a Bestseller: " + error.message);
        return;
      }
    }
    loadSoldOutStatus();
  }

  async function toggleSoldOut(name, currentlyOut) {
    if (currentlyOut) {
      const { error } = await db.from("sold_out_items").delete().eq("item_name", name);
      if (error) {
        window.alert("Couldn't mark it available: " + error.message);
        return;
      }
    } else {
      const { error } = await db.from("sold_out_items").insert({ item_name: name });
      if (error) {
        window.alert("Couldn't mark it sold out: " + error.message);
        return;
      }
    }
    loadSoldOutStatus();
  }

  async function toggleArchive(name, currentlyArchived) {
    if (currentlyArchived) {
      const { error } = await db.from("archived_items").delete().eq("item_name", name);
      if (error) {
        window.alert("Couldn't unarchive it: " + error.message);
        return;
      }
    } else {
      if (
        !window.confirm(
          `Archive "${name}"? It'll disappear completely from the live menu until you unarchive it.`
        )
      ) {
        return;
      }
      const { error } = await db.from("archived_items").insert({ item_name: name });
      if (error) {
        window.alert("Couldn't archive it: " + error.message);
        return;
      }
    }
    loadSoldOutStatus();
  }

  el("availSearch").addEventListener("input", () => {
    renderMenuAvailability(el("availSearch").value);
  });

  /* ------------------------------------------------------------------
     Sales trend — last 14 calendar days, hand-drawn as plain bars
     rather than pulling in a charting library for one simple chart.
     ------------------------------------------------------------------ */

  async function loadTrendChart() {
    const days = 14;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const { data, error } = await db
      .from("orders")
      .select("total, status, created_at")
      .gte("created_at", start.toISOString());

    const wrap = el("trendChart");
    if (error || !data) {
      wrap.innerHTML = '<p class="dash-empty">Couldn\'t load the trend chart.</p>';
      return;
    }

    /* One bucket per day, oldest to newest, always all 14 days present
       even if some had zero orders. */
    const byDay = new Map();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      byDay.set(d.toDateString(), { sales: 0, orders: 0 });
    }
    data.forEach((o) => {
      if (o.status === "cancelled") return;
      const day = byDay.get(new Date(o.created_at).toDateString());
      if (!day) return;
      day.sales += Number(o.total || 0);
      day.orders += 1;
    });

    const values = [...byDay.entries()];
    const max = Math.max(1, ...values.map(([, v]) => v.sales));

    wrap.innerHTML = "";
    values.forEach(([dateStr, { sales: value, orders }]) => {
      const d = new Date(dateStr);
      const bar = document.createElement("div");
      bar.className = "trend-bar";
      bar.title =
        `${d.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}: ` +
        `${money(value)} from ${orders} order${orders === 1 ? "" : "s"}`;

      const fill = document.createElement("div");
      fill.className = "trend-fill";
      fill.style.height = Math.max(3, Math.round((value / max) * 100)) + "%";
      bar.appendChild(fill);

      const label = document.createElement("span");
      label.className = "trend-label";
      label.textContent = String(d.getDate());
      bar.appendChild(label);

      wrap.appendChild(bar);
    });
  }

  /* ------------------------------------------------------------------
     Add a menu item — writes straight to custom_menu_items, which the
     site merges into the live menu on its own (see app.js). Existing
     menu.js items aren't editable from here, only new ones added this
     way; removing one just deletes its row.
     ------------------------------------------------------------------ */

  function populateCategoryDropdown() {
    const sel = el("itemCategory");
    sel.innerHTML = "";
    if (typeof MENU !== "undefined") {
      MENU.forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g.category;
        opt.textContent = g.category;
        sel.appendChild(opt);
      });
    }
    const otherOpt = document.createElement("option");
    otherOpt.value = "__new__";
    otherOpt.textContent = "New category…";
    sel.appendChild(otherOpt);
  }

  el("itemCategory").addEventListener("change", () => {
    el("itemNewCategory").style.display = el("itemCategory").value === "__new__" ? "" : "none";
  });

  /* Uploads a chosen photo to the menu-photos storage bucket and
     returns its public URL, or null if no file was chosen. Errors bubble
     up to the caller rather than being handled here, since "couldn't
     upload the photo" and "couldn't save the item" show the same way
     to staff — one error message, either way. */
  async function uploadItemPhoto(file) {
    if (!file) return null;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const safeName = file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const path = `${Date.now()}-${safeName || "photo"}.${ext}`;

    const { error } = await db.storage.from("menu-photos").upload(path, file);
    if (error) throw error;

    const { data } = db.storage.from("menu-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  el("addItemForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = el("additemError");
    errEl.style.display = "none";

    const categorySel = el("itemCategory").value;
    const category = categorySel === "__new__" ? el("itemNewCategory").value.trim() : categorySel;
    const name = el("itemName").value.trim();
    const price = Number(el("itemPrice").value);
    const description = el("itemDescription").value.trim();
    const note = el("itemNote").value.trim();
    const imageFile = el("itemImageFile").files[0] || null;
    const imageUrlTyped = el("itemImageUrl").value.trim();
    const popular = el("itemPopular").checked;

    if (!category || !name || !price) {
      errEl.textContent = "Category, name and price are required.";
      errEl.style.display = "";
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = imageFile ? "Uploading photo…" : "Adding…";

    let imageUrl = imageUrlTyped;
    if (imageFile) {
      try {
        imageUrl = await uploadItemPhoto(imageFile);
      } catch (uploadError) {
        errEl.textContent = "Couldn't upload the photo: " + uploadError.message;
        errEl.style.display = "";
        submitBtn.disabled = false;
        submitBtn.textContent = "Add to menu";
        return;
      }
    }

    const { error } = await db.from("custom_menu_items").insert({
      category,
      name,
      price,
      description: description || null,
      note: note || null,
      image_url: imageUrl || null,
      popular,
      sold_out: false,
    });

    submitBtn.disabled = false;
    submitBtn.textContent = "Add to menu";

    if (error) {
      errEl.textContent = "Couldn't add it: " + error.message;
      errEl.style.display = "";
      return;
    }

    el("addItemForm").reset();
    el("itemNewCategory").style.display = "none";
    populateCategoryDropdown();
    loadCustomItems();
  });

  /* Fetches items added from the form above and folds them into Menu
     availability (see buildCustomRow/renderMenuAvailability) rather
     than keeping a separate list — so they get the same sold-out/price
     controls as everything else, under their actual category. */
  async function loadCustomItems() {
    const { data, error } = await db
      .from("custom_menu_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Couldn't load added items:", error);
      return;
    }
    customItems = data || [];
    renderMenuAvailability(el("availSearch").value);
  }

  checkSession();
})();