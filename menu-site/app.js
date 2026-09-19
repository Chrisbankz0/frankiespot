/* =====================================================================
   APP LOGIC

   You shouldn't need to edit this file. Everything you'd normally want
   to change lives in menu.js (the food and the business details) or
   styles.css (the colours).

   Reads: BUSINESS and MENU, defined in menu.js.
   ===================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */

  const money = (n) => "₦" + Number(n).toLocaleString("en-NG");

  /* The crossed-out "was" price for a bonanza item: the real price
     divided by 0.7, rounded to the nearest ₦100 so it reads as a clean
     number. Dividing back up by 0.7 is what makes the badge a true -30%,
     rather than a fake round-trip through +30%. */
  const wasPrice = (price) => Math.round((price / 0.7) / 100) * 100;

  const slug = (s) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  /* Initials for the fallback tile. Joining words are skipped so that
     "Beef and egg sauce" reads BE rather than BA. */
  const SKIP = /^(and|or|with|the|a|of|&)$/i;
  const initials = (name) => {
    const words = name.trim().split(/\s+/).filter((w) => !SKIP.test(w));
    return (words.length ? words : [name])
      .slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  };

  const el = (id) => document.getElementById(id);

  /* Escapes text before it goes near innerHTML. */
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));

  /**
   * Builds a thumbnail. Falls back to a lettered tile when the photo is
   * missing or the filename is wrong, so a broken path never breaks the page.
   */
  function thumbnail(item, className) {
    const box = document.createElement("div");
    box.className = "thumb" + (className ? " " + className : "");

    const fallback = document.createElement("div");
    fallback.className = "fallback";
    fallback.textContent = initials(item.name);
    fallback.setAttribute("aria-hidden", "true");
    box.appendChild(fallback);

    if (item.image) {
      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      /* The fallback tile is positioned to always paint above a plain,
         non-positioned img — that's what keeps a broken photo from ever
         looking like a blank box. But it means a *working* photo needs
         to explicitly remove the fallback once it's actually loaded,
         rather than relying on paint order to hide it. */
      img.onload = () => fallback.remove();
      img.onerror = () => img.remove();   // leaves the fallback showing
      img.src = item.image;
      box.appendChild(img);
    }
    return box;
  }

  /* ------------------------------------------------------------------
     Cart
     Keyed by "Item name" or "Item name::Size", so the same dish in two
     sizes counts as two separate lines.
     ------------------------------------------------------------------ */

  const cart = new Map();

  /* Free-text order, from the "custom order" box at the end of the menu.
     Not priced — staff quote it back in the WhatsApp chat — but it still
     needs to travel through the same send/clear flow as the cart. */
  let customNote = "";

  const subtotal = () =>
    [...cart.values()].reduce((sum, l) => sum + l.unit * l.qty, 0);

  const itemCount = () =>
    [...cart.values()].reduce((sum, l) => sum + l.qty, 0);

  /* One flat pack/nylon fee per order — not per dish. It's deliberately
     left out of subtotal()/refresh() math because it should only ever
     appear in the WhatsApp message (see buildMessage below), never in
     the on-page cart totals. */
  const packagingFee = () => BUSINESS.packagingFee || 0;

  function addToCart(key, name, unit, item, qty) {
    qty = qty || 1;
    const line = cart.get(key);
    if (line) line.qty += qty;
    else cart.set(key, { key, name, unit, qty, item });
    refresh();
  }

  function changeQty(key, delta) {
    const line = cart.get(key);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) cart.delete(key);
    refresh();
  }

  function removeLine(key) {
    cart.delete(key);
    refresh();
  }

  function clearCart() {
    cart.clear();
    customNote = "";
    syncCustomOrderUI();
    el("backupBtn").style.display = "none";
    orderSaved = false;
    showCartScreen();
    refresh();
  }

  /* ------------------------------------------------------------------
     Reusable quantity stepper
     ------------------------------------------------------------------ */

  function stepper(key, name, qty, compact) {
    const box = document.createElement("div");
    box.className = "stepper" + (compact ? " compact" : "");

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "\u2212";
    minus.setAttribute("aria-label", "Remove one " + name);
    minus.onclick = () => changeQty(key, -1);

    const num = document.createElement("span");
    num.className = "qty";
    num.textContent = qty;
    num.setAttribute("aria-live", "polite");

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "Add one " + name);
    plus.onclick = () => changeQty(key, 1);

    box.append(minus, num, plus);
    return box;
  }

  /* ------------------------------------------------------------------
     Header and footer
     ------------------------------------------------------------------ */

  document.title = BUSINESS.name + " — Menu";

  /* The name always sits in the H1, for screen readers and search engines.
     When there's a logo, the picture takes its place on screen and the H1
     is hidden visually only. A broken image path brings the wordmark back. */
  const brandEl = el("brandName");
  brandEl.textContent = BUSINESS.name;

  if (BUSINESS.logo) {
    const mark = document.createElement("img");
    mark.className = "logo";
    mark.src = BUSINESS.logo;
    mark.alt = "";                       // the H1 already carries the name
    mark.width = 132;
    mark.height = 132;
    mark.onerror = () => {
      mark.remove();
      brandEl.classList.remove("sr-only");
    };
    brandEl.classList.add("sr-only");
    brandEl.parentNode.insertBefore(mark, brandEl);
  }

  el("brandTagline").textContent = BUSINESS.tagline;

  const facts = [];
  if (BUSINESS.areas) facts.push(`Delivering to <strong>${esc(BUSINESS.areas)}</strong>`);
  if (BUSINESS.hours) facts.push(`Open <strong>${esc(BUSINESS.hours)}</strong>`);
  if (BUSINESS.orderNotice) facts.push(esc(BUSINESS.orderNotice));
  el("brandFacts").innerHTML = facts.map((f) => `<div>${f}</div>`).join("");

  const foot = [
    `<p>Add what you want, then send the order to us on WhatsApp. We'll confirm your delivery fee and total in the chat, and share account details for payment.</p>`,
  ];
  if (BUSINESS.minimumOrder > 0) {
    foot.push(`<p>Minimum order <strong>${money(BUSINESS.minimumOrder)}</strong>, before delivery.</p>`);
  }
  if (BUSINESS.instagram) {
    foot.push(`<p>Find us on Instagram at <strong>${esc(BUSINESS.instagram)}</strong></p>`);
  }
  foot.push(`<p>Prices may change. What you see here is what we charge today.</p>`);
  el("pageFoot").innerHTML = foot.join("");

  /* ------------------------------------------------------------------
     Build the menu
     ------------------------------------------------------------------ */

  const menuEl = el("menu");
  const navEl = el("catnav");

  /* Every add button on the page, so refresh() can update them in place. */
  const controls = [];

  /* Created early (not just for order-saving further down) since the
     sold-out check right after the menu builds also needs it.
     persistSession: false — this page is for anonymous customers only.
     Without this, a staff member testing both this page and admin.html
     in the same browser would have their logged-in session picked up
     here too, which breaks order-saving since staff accounts aren't
     allowed to CREATE orders, only view and cancel them. */
  const dbClient =
    typeof supabase !== "undefined" &&
    typeof SUPABASE_URL !== "undefined" &&
    SUPABASE_URL &&
    SUPABASE_ANON_KEY
      ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: false },
        })
      : null;

  /* Builds one card for an item — used both for the regular category
     rows and for the Bestsellers row below, so the two never drift out
     of sync with each other. */
  function buildCard(item) {
    const card = document.createElement("div");
    card.className = "card" + (item.soldOut ? " is-out" : "");
    card.dataset.itemName = item.name;

    const media = document.createElement("div");
    media.className = "card-media";

    /* Photo opens the detail view. The + button sits on top of it as
       its own control, so tapping the corner never opens the detail. */
    const photoBtn = document.createElement("button");
    photoBtn.type = "button";
    photoBtn.className = "card-photo-btn";
    photoBtn.setAttribute("aria-label", "See details for " + item.name);
    photoBtn.onclick = () => openDetail(item);
    photoBtn.appendChild(thumbnail(item));
    media.appendChild(photoBtn);

    if (item.bonanza && !item.soldOut) {
      const badge = document.createElement("span");
      badge.className = "card-badge";
      badge.textContent = "-30%";
      media.appendChild(badge);
    } else if (item.soldOut) {
      const badge = document.createElement("span");
      badge.className = "card-badge out";
      badge.textContent = "Finished";
      media.appendChild(badge);
    }

    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "card-plus";
    plus.disabled = !!item.soldOut;
    plus.setAttribute("aria-label", "Add " + item.name);
    plus.innerHTML =
      `<span class="card-plus-icon" aria-hidden="true">+</span>` +
      `<span class="card-plus-badge" aria-hidden="true"></span>`;
    plus.onclick = () => {
      /* A dish with size/base choices can't be added blind from the
         card — open the detail view so the choice gets made first. */
      if (item.sizes && item.sizes.length) { openDetail(item); return; }
      addToCart(item.name, item.name, item.price, item);
    };
    media.appendChild(plus);

    /* Shows how many of this dish are already in the cart, right on
       the card — otherwise it's easy to lose track while scrolling
       sideways through a long row and tap + again by mistake. Only
       wired up for simple items; a dish with size choices is added
       via the detail view instead, so there's no single card-level
       count that would make sense to show. */
    if (!(item.sizes && item.sizes.length)) {
      const badgeEl = plus.querySelector(".card-plus-badge");
      const renderBadge = () => {
        const line = cart.get(item.name);
        const qty = line ? line.qty : 0;
        badgeEl.textContent = qty > 0 ? String(qty) : "";
        badgeEl.classList.toggle("is-visible", qty > 0);
        plus.setAttribute(
          "aria-label",
          qty > 0 ? `${item.name}, ${qty} in cart, add one more` : "Add " + item.name
        );
      };
      renderBadge();
      controls.push(renderBadge);
    }

    card.appendChild(media);

    const info = document.createElement("div");
    info.className = "card-info";

    let tags = "";
    if (item.popular && !item.soldOut) tags += `<span class="tag">Bestseller</span>`;
    if (item.note) tags += `<span class="tag info">${esc(item.note)}</span>`;

    info.innerHTML =
      `<div class="card-name">${esc(item.name)}</div>` +
      (tags ? `<div class="card-tags">${tags}</div>` : "");

    const priceRow = document.createElement("div");
    priceRow.className = "card-price";
    if (item.sizes && item.sizes.length) {
      const cheapest = Math.min(...item.sizes.map((s) => s.price));
      priceRow.innerHTML = `<span class="price">From ${money(cheapest)}</span>`;
    } else {
      priceRow.innerHTML =
        (item.bonanza ? `<span class="price-was">${money(wasPrice(item.price))}</span>` : "") +
        `<span class="price">${money(item.price)}</span>`;
    }
    info.appendChild(priceRow);
    card.appendChild(info);

    return card;
  }

  /* Bestsellers — every item tagged popular: true, gathered into its
     own row right at the top, so a first-time visitor sees the
     highlights immediately instead of having to dig into 60 combo
     items first to find them. No nav pill of its own; it's already
     the first thing on the page. */
  const bestsellerItems = [];
  MENU.forEach((group) => {
    group.items.forEach((item) => {
      if (item.popular && !item.soldOut) bestsellerItems.push(item);
    });
  });

  if (bestsellerItems.length) {
    const section = document.createElement("section");
    section.className = "group";
    section.id = "group-bestsellers";

    const head = document.createElement("div");
    head.className = "group-head";
    head.innerHTML = `<h2>Bestsellers</h2><span>What everyone's ordering</span>`;
    section.appendChild(head);

    const track = document.createElement("div");
    track.className = "track";
    section.appendChild(track);

    const startSpacer = document.createElement("div");
    startSpacer.className = "track-spacer";
    startSpacer.setAttribute("aria-hidden", "true");
    track.appendChild(startSpacer);

    bestsellerItems.forEach((item) => track.appendChild(buildCard(item)));

    const endSpacer = document.createElement("div");
    endSpacer.className = "track-spacer";
    endSpacer.setAttribute("aria-hidden", "true");
    track.appendChild(endSpacer);

    menuEl.appendChild(section);
  }

  /* Hero backdrop — reuses the same bestseller photos already chosen
     above. Each image is loaded independently; one that hasn't been
     added yet (or fails for any reason) is just silently skipped, so
     this never risks showing a broken image or an empty gap. */
  (function setUpHeroBackdrop() {
    const bgHost = el("mastheadBg");
    if (!bgHost || !bestsellerItems.length) return;

    const candidates = bestsellerItems.filter((i) => i.image).slice(0, 5);
    const loaded = [];
    let rotating = false;

    candidates.forEach((item) => {
      const img = new Image();
      img.alt = "";
      img.onload = () => {
        loaded.push(img);
        bgHost.appendChild(img);
        if (loaded.length === 1) img.classList.add("is-active");
        if (!rotating && loaded.length >= 2) {
          rotating = true;
          let i = 0;
          setInterval(() => {
            loaded[i].classList.remove("is-active");
            i = (i + 1) % loaded.length;
            loaded[i].classList.add("is-active");
          }, 4500);
        }
      };
      img.src = item.image;
    });
  })();

  /* Guessed from the category name itself, so a renamed or newly added
     category (like Shawarma) still gets a sensible icon automatically,
     without needing a manual lookup kept in sync with menu.js. Falls
     back to a plain plate for anything unrecognised. */
  function categoryIcon(name) {
    const n = name.toLowerCase();
    if (n.includes("rice") || n.includes("spaghetti")) return "🍛";
    if (n.includes("side")) return "🍟";
    if (n.includes("protein")) return "🍗";
    if (n.includes("soup")) return "🍲";
    if (n.includes("swallow")) return "🥣";
    if (n.includes("shawarma")) return "🌯";
    return "🍽️";
  }

  /* Finds an existing category section by name, or builds a brand-new
     one (with its own nav pill, wired into the same scroll-spy as
     everything else) if this is a category that doesn't exist in
     menu.js at all. Used for items added live from the dashboard. */
  function ensureCategorySection(categoryName) {
    const secId = "group-" + slug(categoryName);
    const existing = document.getElementById(secId);
    if (existing) return existing;

    const pill = document.createElement("button");
    pill.type = "button";
    pill.innerHTML =
      `<span class="pill-icon" aria-hidden="true">${categoryIcon(categoryName)}</span>${esc(categoryName)}`;
    pill.dataset.target = secId;
    pill.onclick = () => el(secId).scrollIntoView({ behavior: "smooth", block: "start" });
    navEl.appendChild(pill);
    pills.push(pill);

    const section = document.createElement("section");
    section.className = "group";
    section.id = secId;

    const head = document.createElement("div");
    head.className = "group-head";
    head.innerHTML = `<h2>${esc(categoryName)}</h2>`;
    section.appendChild(head);

    const track = document.createElement("div");
    track.className = "track";
    section.appendChild(track);

    const startSpacer = document.createElement("div");
    startSpacer.className = "track-spacer";
    startSpacer.setAttribute("aria-hidden", "true");
    track.appendChild(startSpacer);

    const endSpacer = document.createElement("div");
    endSpacer.className = "track-spacer";
    endSpacer.setAttribute("aria-hidden", "true");
    track.appendChild(endSpacer);

    menuEl.appendChild(section);
    observer.observe(section);

    return section;
  }

  MENU.forEach((group) => {
    const secId = "group-" + slug(group.category);

    const pill = document.createElement("button");
    pill.type = "button";
    pill.innerHTML =
      `<span class="pill-icon" aria-hidden="true">${categoryIcon(group.category)}</span>${esc(group.category)}`;
    pill.dataset.target = secId;
    pill.onclick = () =>
      el(secId).scrollIntoView({ behavior: "smooth", block: "start" });
    navEl.appendChild(pill);

    const section = document.createElement("section");
    section.className = "group";
    section.id = secId;

    const head = document.createElement("div");
    head.className = "group-head";
    head.innerHTML =
      `<h2>${esc(group.category)}</h2>` +
      (group.blurb ? `<span>${esc(group.blurb)}</span>` : "");
    section.appendChild(head);

    /* Every category is a horizontally-scrolling row of cards, the phone
       swipes sideways through combos, then swipes sideways through
       proteins, and so on — one strip per category, stacked down the page. */
    const track = document.createElement("div");
    track.className = "track";
    section.appendChild(track);

    const startSpacer = document.createElement("div");
    startSpacer.className = "track-spacer";
    startSpacer.setAttribute("aria-hidden", "true");
    track.appendChild(startSpacer);

    group.items.forEach((item) => track.appendChild(buildCard(item)));

    const endSpacer = document.createElement("div");
    endSpacer.className = "track-spacer";
    endSpacer.setAttribute("aria-hidden", "true");
    track.appendChild(endSpacer);

    menuEl.appendChild(section);
  });

  /* ------------------------------------------------------------------
     Cart bar and order sheet
     ------------------------------------------------------------------ */

  const bar = el("barBtn");
  const sheet = el("sheet");
  const scrim = el("scrim");
  const cartScreen = el("cartScreen");
  const detailsScreen = el("detailsScreen");
  const continueBtn = el("continueBtn");
  const sendBtn = el("sendBtn");
  let lastFocused = null;

  function showCartScreen() {
    cartScreen.style.display = "";
    detailsScreen.style.display = "none";
  }

  function showDetailsScreen() {
    cartScreen.style.display = "none";
    detailsScreen.style.display = "";
    /* Reuse the last name/phone typed on this device, since asking the
       same regular customer to retype it every single order is exactly
       the kind of friction this whole change was meant to remove. */
    if (!el("custName").value) el("custName").value = localStorage.getItem("fp_name") || "";
    if (!el("custPhone").value) el("custPhone").value = localStorage.getItem("fp_phone") || "";
    if (!el("custAddress").value) el("custAddress").value = localStorage.getItem("fp_address") || "";
    el("custName").focus();
  }

  function refresh() {
    const count = itemCount();
    el("barCount").textContent = count;
    bar.setAttribute("aria-label", `Review your order — ${count} item${count === 1 ? "" : "s"}, ${money(subtotal())}`);
    bar.classList.toggle("is-visible", count > 0 || !!customNote);

    controls.forEach((render) => render());

    if (sheet.classList.contains("is-open")) {
      if (cart.size === 0 && !customNote) closeSheet();
      else renderSheet();
    }
  }

  function openSheet() {
    lastFocused = document.activeElement;
    showCartScreen();
    renderSheet();
    sheet.classList.add("is-open");
    scrim.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    el("closeSheet").focus();
  }

  function closeSheet() {
    sheet.classList.remove("is-open");
    scrim.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  el("barBtn").onclick = openSheet;
  el("closeSheet").onclick = closeSheet;
  scrim.onclick = closeSheet;
  el("clearBtn").onclick = clearCart;
  el("backToCartBtn").onclick = showCartScreen;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheet.classList.contains("is-open")) closeSheet();
  });

  /* ------------------------------------------------------------------
     Custom order box
     Free text for anything not on the menu. Saved into customNote,
     which rides along with the cart through the same send/clear flow.
     ------------------------------------------------------------------ */

  const customText = el("customText");
  const customAddBtn = el("customAddBtn");
  const customHint = el("customHint");

  function syncCustomOrderUI() {
    customText.value = customNote;
    if (customNote) {
      customHint.textContent = "Added — it'll be included when you send your order.";
      customHint.style.display = "";
      customAddBtn.textContent = "Update";
    } else {
      customHint.style.display = "none";
      customAddBtn.textContent = "Add to order";
    }
  }

  customAddBtn.onclick = () => {
    customNote = customText.value.trim();
    syncCustomOrderUI();
    refresh();
  };

  /* ------------------------------------------------------------------
     Dish detail view
     Opens when a photo or name is tapped. Its stepper only counts how
     many to add next — it doesn't read from the cart — so it always
     starts back at one each time it opens.
     ------------------------------------------------------------------ */

  const detail = el("detail");
  const detailScrim = el("detailScrim");
  let detailItem = null;
  let detailQty = 1;
  let detailLastFocused = null;

  function renderDetail() {
    if (!detailItem) return;
    const item = detailItem;

    el("detailPrice").innerHTML = item.bonanza
      ? `<span class="price-was">${money(wasPrice(item.price))}</span><span class="price">${money(item.price)}</span>`
      : `<span class="price">${money(item.price)}</span>`;

    el("detailQty").textContent = detailQty;
    el("detailAdd").textContent = item.soldOut
      ? "Finished for today"
      : `Add ${money(item.price * detailQty)}`;
    el("detailAdd").disabled = !!item.soldOut;
  }

  function openDetail(item) {
    detailItem = item;
    detailQty = 1;
    detailLastFocused = document.activeElement;

    let tags = "";
    if (item.bonanza && !item.soldOut) tags += `<span class="tag discount">-30%</span>`;
    if (item.popular && !item.soldOut) tags += `<span class="tag">Bestseller</span>`;
    if (item.note) tags += `<span class="tag info">${esc(item.note)}</span>`;
    if (item.soldOut) tags += `<span class="tag info">Finished for today</span>`;
    el("detailTags").innerHTML = tags;

    el("detailName").textContent = item.name;
    el("detailDesc").textContent = item.description || "";
    el("detailDesc").style.display = item.description ? "" : "none";

    const photo = el("detailPhoto");
    photo.querySelectorAll("img, .fallback").forEach((n) => n.remove());
    const fallback = document.createElement("div");
    fallback.className = "fallback";
    fallback.textContent = initials(item.name);
    fallback.setAttribute("aria-hidden", "true");
    photo.appendChild(fallback);
    if (item.image) {
      const img = document.createElement("img");
      img.alt = "";
      img.onload = () => fallback.remove();
      img.onerror = () => img.remove();
      img.src = item.image;
      photo.appendChild(img);
    }

    renderDetail();

    detail.classList.add("is-open");
    detailScrim.classList.add("is-open");
    detail.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    el("detailClose").focus();
  }

  function closeDetail() {
    detail.classList.remove("is-open");
    detailScrim.classList.remove("is-open");
    detail.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (detailLastFocused) detailLastFocused.focus();
    detailItem = null;
  }

  el("detailClose").onclick = closeDetail;
  detailScrim.onclick = closeDetail;
  el("detailMinus").onclick = () => {
    if (detailQty > 1) { detailQty -= 1; renderDetail(); }
  };
  el("detailPlus").onclick = () => {
    detailQty += 1; renderDetail();
  };
  el("detailAdd").onclick = () => {
    if (!detailItem || detailItem.soldOut) return;
    addToCart(detailItem.name, detailItem.name, detailItem.price, detailItem, detailQty);
    closeDetail();
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && detail.classList.contains("is-open")) closeDetail();
  });

  function renderSheet() {
    const lines = el("lines");
    lines.innerHTML = "";

    if (cart.size === 0 && !customNote) {
      lines.innerHTML = `<p class="empty">Nothing added yet.</p>`;
    }

    [...cart.values()].forEach((line) => {
      const row = document.createElement("div");
      row.className = "line";

      row.appendChild(thumbnail(line.item || { name: line.name }));

      const body = document.createElement("div");
      body.className = "line-body";
      body.innerHTML =
        `<div class="line-name">${esc(line.name)}</div>` +
        `<div class="line-unit">${money(line.unit)} each</div>`;
      body.appendChild(stepper(line.key, line.name, line.qty, true));
      row.appendChild(body);

      const right = document.createElement("div");
      right.className = "line-right";

      const total = document.createElement("div");
      total.className = "line-total";
      total.textContent = money(line.unit * line.qty);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "remove";
      del.textContent = "Remove";
      del.setAttribute("aria-label", "Remove " + line.name + " from your order");
      del.onclick = () => removeLine(line.key);

      right.append(total, del);
      row.appendChild(right);
      lines.appendChild(row);
    });

    if (customNote) {
      const row = document.createElement("div");
      row.className = "line line-custom";

      const body = document.createElement("div");
      body.className = "line-body";
      const label = document.createElement("div");
      label.className = "line-name";
      label.textContent = "Custom order";
      const text = document.createElement("div");
      text.className = "line-custom-text";
      text.textContent = customNote;
      body.append(label, text);
      row.appendChild(body);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "remove";
      del.textContent = "Remove";
      del.setAttribute("aria-label", "Remove your custom order note");
      del.onclick = () => {
        customNote = "";
        syncCustomOrderUI();
        refresh();
      };
      row.appendChild(del);
      lines.appendChild(row);
    }

    const sub = subtotal();
    const shortfall = (BUSINESS.minimumOrder || 0) - sub;
    const belowMinimum = cart.size > 0 && shortfall > 0;

    if (belowMinimum) {
      const pct = Math.min(100, Math.round((sub / BUSINESS.minimumOrder) * 100));
      el("noticeSlot").innerHTML =
        `<div class="notice">Add ${money(shortfall)} more to reach the ${money(BUSINESS.minimumOrder)} minimum order.` +
        `<div class="min-track"><div class="min-fill" style="width:${pct}%;"></div></div></div>`;
    } else {
      el("noticeSlot").innerHTML = "";
    }

    /* Packaging is deliberately left out of every row here — it's a flat
       fee that only ever shows up once the order reaches WhatsApp, see
       buildMessage() below. */
    const rows = [
      `<div class="trow"><span>Subtotal</span><span>${money(sub)}</span></div>`,
    ];
    if (BUSINESS.deliveryFee != null) {
      rows.push(`<div class="trow"><span>Delivery</span><span>${money(BUSINESS.deliveryFee)}</span></div>`);
      rows.push(`<div class="trow grand"><span>Total</span><span>${money(sub + BUSINESS.deliveryFee)}</span></div>`);
    } else {
      rows.push(`<div class="trow"><span>Delivery</span><span>Confirmed in chat</span></div>`);
      rows.push(`<div class="trow grand"><span>Food total</span><span>${money(sub)}</span></div>`);
    }
    el("totals").innerHTML = rows.join("");

    el("clearBtn").style.visibility = (cart.size || customNote) ? "visible" : "hidden";
    continueBtn.disabled = (cart.size === 0 && !customNote) || belowMinimum;

    renderCrossSell();
  }

  /* "You'll probably also want..." — soup without a swallow (or the
     other way round) is almost always an oversight, not a choice, so
     this offers the obvious missing half right where the cart is
     reviewed. Only ever shows one suggestion at a time, to stay a
     helpful nudge rather than a wall of upsells. */
  function renderCrossSell() {
    const slot = el("crossSellSlot");
    slot.innerHTML = "";
    if (cart.size === 0) return;

    const categoriesInCart = new Set();
    cart.forEach((line) => {
      const entry = searchIndex.find((e) => e.item.name === line.name);
      if (entry) categoriesInCart.add(entry.category);
    });

    const pairs = [
      { have: "Soups", need: "Swallow", prompt: "Got soup — forgot the swallow?" },
      { have: "Swallow", need: "Soups", prompt: "Got swallow — forgot the soup?" },
    ];

    const pairsInCart = [
      { have: "Rice Combos", need: "Protein Combos", prompt: "Got a rice combo — want a protein combo too?" },
      { have: "Protein Combos", need: "Rice Combos", prompt: "Got a protein combo — want a rice combo too?" },
    ]

    for (const pair of pairs) {
      if (!categoriesInCart.has(pair.have) || categoriesInCart.has(pair.need)) continue;
      const group = MENU.find((g) => g.category === pair.need);
      if (!group) continue;

      const box = document.createElement("div");
      box.className = "cross-sell";

      const prompt = document.createElement("p");
      prompt.className = "cross-sell-prompt";
      prompt.textContent = pair.prompt;
      box.appendChild(prompt);

      const row = document.createElement("div");
      row.className = "cross-sell-row";
      group.items
        .filter((item) => !item.soldOut)
        .slice(0, 4)
        .forEach((item) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "cross-sell-btn";
          btn.textContent = `+ ${item.name} · ${money(item.price)}`;
          btn.onclick = () => addToCart(item.name, item.name, item.price, item);
          row.appendChild(btn);
        });
      box.appendChild(row);

      slot.appendChild(box);
      break;
    }
  }

  /* ------------------------------------------------------------------
     WhatsApp handoff
     Builds the order as a text message and opens it in a chat with the
     number in BUSINESS.whatsapp, ready for the customer to send.
     ------------------------------------------------------------------ */

  function buildMessage(details) {
    const sub = subtotal();
    const pack = packagingFee();
    const out = [`*New order — ${BUSINESS.name}*`, ""];

    cart.forEach((line) => {
      out.push(`${line.qty}\u00D7 ${line.name} — ${money(line.unit * line.qty)}`);
    });

    if (customNote) {
      if (cart.size > 0) out.push("");
      out.push("Custom order:", customNote);
    }

    out.push("");
    if (sub > 0) out.push(`Subtotal: ${money(sub)}`);
    if (pack > 0) out.push(`Packaging: ${money(pack)}`);

    if (BUSINESS.deliveryFee != null) {
      out.push(`Delivery: ${money(BUSINESS.deliveryFee)}`);
      out.push(`*Total: ${money(sub + pack + BUSINESS.deliveryFee)}*`);
    } else {
      out.push(`*Total: ${money(sub + pack)}*`);
    }

    out.push("", `Name: ${details.name}`, `Phone: ${details.phone}`, `Delivery address: ${details.address}`);
    if (details.time) out.push(`Preferred time: ${details.time}`);

    return out.join("\n");
  }

  const backupBtn = el("backupBtn");
  let lastDetails = null; // so the backup-number retry reuses the same details

  function waLink(number, details) {
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(buildMessage(details));
  }

  /* ------------------------------------------------------------------
     Dashboard order-saving
     Fires once per order, the instant "Send" is tapped — before the
     WhatsApp chat even opens. This never blocks or delays the WhatsApp
     handoff: if the save fails for any reason (offline, misconfigured
     database), the order still goes through exactly as before. Nothing
     here is customer-visible.
     ------------------------------------------------------------------ */

  let orderSaved = false;

  function saveOrderToDatabase(numberUsed, details) {
    if (!dbClient || orderSaved) return;
    orderSaved = true;

    const items = [...cart.values()].map((line) => ({
      name: line.name,
      qty: line.qty,
      unit_price: line.unit,
      line_total: line.unit * line.qty,
    }));
    const sub = subtotal();
    const pack = packagingFee();
    const total = sub + pack + (BUSINESS.deliveryFee || 0);

    dbClient
      .from("orders")
      .insert({
        items,
        custom_note: customNote || null,
        subtotal: sub,
        packaging_fee: pack,
        delivery_fee: BUSINESS.deliveryFee,
        total,
        whatsapp_used: numberUsed,
        customer_name: details.name,
        customer_phone: details.phone,
        customer_address: details.address,
        preferred_time: details.time || null,
      })
      .then(({ error }) => {
        if (error) console.error("Order save failed (order still sent fine):", error);
      });
  }

  continueBtn.onclick = () => {
    if (continueBtn.disabled) return;
    showDetailsScreen();
  };

  /* Reads and checks the details form. Returns null (and shows an inline
     error) if something required is missing, otherwise the details. */
  function readDetails() {
    const name = el("custName").value.trim();
    const phone = el("custPhone").value.trim();
    const address = el("custAddress").value.trim();
    const time = el("custTime").value.trim();
    const errEl = el("detailsError");

    if (!name || !phone || !address) {
      errEl.textContent = "Please fill in your name, phone number and delivery address.";
      errEl.style.display = "";
      return null;
    }
    errEl.style.display = "none";
    return { name, phone, address, time };
  }

  let toastTimer = null;
  function showToast(message) {
    const toastEl = el("toast");
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 3800);
  }

  sendBtn.onclick = () => {
    const details = readDetails();
    if (!details) return;

    localStorage.setItem("fp_name", details.name);
    localStorage.setItem("fp_phone", details.phone);
    localStorage.setItem("fp_address", details.address);
    localStorage.setItem(
      "fp_last_order",
      JSON.stringify({
        items: [...cart.values()].map((l) => ({ key: l.key, name: l.name, unit: l.unit, qty: l.qty, item: l.item })),
        customNote: customNote || null,
      })
    );

    lastDetails = details;
    saveOrderToDatabase(BUSINESS.whatsapp, details);
    window.open(waLink(BUSINESS.whatsapp, details), "_blank", "noopener");
    if (BUSINESS.whatsappBackup) backupBtn.style.display = "";
    showToast("Order sent! Check WhatsApp to confirm.");
  };

  backupBtn.onclick = () => {
    const details = lastDetails || readDetails();
    if (!details) return;
    saveOrderToDatabase(BUSINESS.whatsappBackup, details);
    window.open(waLink(BUSINESS.whatsappBackup, details), "_blank", "noopener");
    showToast("Order sent to our other number! Check WhatsApp to confirm.");
  };

  /* ------------------------------------------------------------------
     Highlight whichever section is on screen
     ------------------------------------------------------------------ */

  const pills = [...navEl.querySelectorAll("button")];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        pills.forEach((p) =>
          p.setAttribute("aria-current", String(p.dataset.target === entry.target.id))
        );
        const active = pills.find((p) => p.dataset.target === entry.target.id);
        if (active) active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
    },
    { rootMargin: "-60px 0px -70% 0px", threshold: 0 }
  );
  document.querySelectorAll(".group").forEach((s) => observer.observe(s));

  /* ------------------------------------------------------------------
     Live sold-out status
     menu.js's own soldOut: true still works exactly as before — this
     is an ADDITIONAL, instant override staff can flip from the
     dashboard without touching code. Checked once on load; if it fails
     or is unavailable for any reason, the page just shows whatever
     menu.js already says, same as always.
     ------------------------------------------------------------------ */

  function markCardSoldOut(name) {
    document.querySelectorAll(".card[data-item-name]").forEach((card) => {
      if (card.dataset.itemName !== name) return;
      if (card.classList.contains("is-out")) return; // already shown as sold out
      card.classList.add("is-out");
      const plus = card.querySelector(".card-plus");
      if (plus) plus.disabled = true;
      const media = card.querySelector(".card-media");
      if (media && !media.querySelector(".card-badge")) {
        const badge = document.createElement("span");
        badge.className = "card-badge out";
        badge.textContent = "Finished";
        media.appendChild(badge);
      }
    });
  }

  /* Archiving is stronger than sold-out: the dish disappears entirely
     rather than showing greyed out, and it's pulled out of search too.
     Past orders that reference it are completely untouched — this only
     changes what's shown on the menu going forward. */
  function removeItemEverywhere(name) {
    document.querySelectorAll(".card[data-item-name]").forEach((card) => {
      if (card.dataset.itemName === name) card.remove();
    });
    const idx = searchIndex.findIndex((e) => e.item.name === name);
    if (idx !== -1) searchIndex.splice(idx, 1);
  }

  /* "We're busy" banner, and whether Bestsellers is allowed to upgrade
     itself to real sales data — one read of the same settings row,
     since both are dashboard-controlled toggles. If the fetch fails or
     bestsellers_auto isn't there yet (migration not run), it defaults
     to true — same behavior as before this toggle existed. */
  if (dbClient) {
    dbClient
      .from("site_status")
      .select("busy, bestsellers_auto")
      .eq("id", 1)
      .then(({ data, error }) => {
        if (error || !data || !data[0]) return;
        if (data[0].busy) {
          el("busyBanner").innerHTML =
            `<div class="busy-banner">Orders may take a little longer than usual right now — we're busy!</div>`;
        }
        if (data[0].bestsellers_auto !== false) {
          upgradeBestsellersFromSales();
        }
      });
  }

  if (dbClient) {
    dbClient
      .from("sold_out_items")
      .select("item_name")
      .then(({ data, error }) => {
        if (error || !data) return;
        data.forEach(({ item_name }) => {
          MENU.forEach((group) => {
            group.items.forEach((item) => {
              if (item.name === item_name) item.soldOut = true;
            });
          });
          markCardSoldOut(item_name);
        });
      });
  }

  /* Price changes made from the dashboard. Mutates the shared item
     objects (so cart, detail view and search all pick up the new price)
     and rewrites the price text on any cards already drawn. */
  if (dbClient) {
    dbClient
      .from("price_overrides")
      .select("item_name, price")
      .then(({ data, error }) => {
        if (error || !data) return;
        data.forEach(({ item_name, price }) => {
          MENU.forEach((group) => {
            group.items.forEach((item) => {
              if (item.name === item_name && !(item.sizes && item.sizes.length)) {
                item.price = Number(price);
              }
            });
          });
          document.querySelectorAll(".card[data-item-name]").forEach((card) => {
            if (card.dataset.itemName !== item_name) return;
            const priceEl = card.querySelector(".card-price .price");
            const wasEl = card.querySelector(".card-price .price-was");
            if (priceEl && !priceEl.textContent.startsWith("From")) priceEl.textContent = money(Number(price));
            if (wasEl) wasEl.textContent = money(wasPrice(Number(price)));
          });
        });
      });
  }

  if (dbClient) {
    dbClient
      .from("archived_items")
      .select("item_name")
      .then(({ data, error }) => {
        if (error || !data) return;
        data.forEach(({ item_name }) => removeItemEverywhere(item_name));
      });
  }

  /* Menu items added live from the dashboard — merged in after the
     static menu.js content is already showing, so there's no delay to
     the initial page render. Slots into an existing category if the
     name matches one, or builds a brand-new category section (with its
     own nav pill) if it doesn't. */
  if (dbClient) {
    dbClient
      .from("custom_menu_items")
      .select("*")
      .then(({ data, error }) => {
        if (error || !data) return;
        data.forEach((row) => {
          const item = {
            name: row.name,
            price: row.price,
            description: row.description || undefined,
            note: row.note || undefined,
            popular: !!row.popular,
            soldOut: !!row.sold_out,
            image: row.image_url || undefined,
          };

          const section = ensureCategorySection(row.category);
          const track = section.querySelector(".track");
          const endSpacer = track.lastElementChild;
          track.insertBefore(buildCard(item), endSpacer);

          searchIndex.push({ item, category: row.category });
        });
      });
  }

  /* Bestsellers, upgraded from a one-time manual guess (popular: true)
     to what's actually selling — checked once on load, after the row
     already shows the manually-tagged items, so there's never a blank
     gap while this loads. Only swaps in if there's enough real order
     history to be more trustworthy than a guess; a brand new site with
     barely any orders yet just keeps showing the manual picks. Staff
     can also switch this off entirely from the dashboard, regardless
     of how much order history exists — see the fetch above. */
  function upgradeBestsellersFromSales() {
    if (!dbClient) return;
    dbClient
      .from("orders")
      .select("items, status")
      .then(({ data, error }) => {
        if (error || !data) return;

        const counts = new Map();
        data.forEach((o) => {
          if (o.status === "cancelled") return;
          (o.items || []).forEach((i) => {
            counts.set(i.name, (counts.get(i.name) || 0) + Number(i.qty || 0));
          });
        });
        if (counts.size < 3) return; // not enough real data to trust yet

        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
        const items = sorted
          .map(([name]) => {
            const entry = searchIndex.find((e) => e.item.name === name);
            return entry ? entry.item : null;
          })
          .filter((item) => item && !item.soldOut);
        if (!items.length) return;

        const section = el("group-bestsellers");
        if (!section) return;
        const track = section.querySelector(".track");
        track.innerHTML = "";

        const startSpacer = document.createElement("div");
        startSpacer.className = "track-spacer";
        startSpacer.setAttribute("aria-hidden", "true");
        track.appendChild(startSpacer);

        items.forEach((item) => track.appendChild(buildCard(item)));

        const endSpacer = document.createElement("div");
        endSpacer.className = "track-spacer";
        endSpacer.setAttribute("aria-hidden", "true");
        track.appendChild(endSpacer);

        const subtitle = section.querySelector(".group-head span");
        if (subtitle) subtitle.textContent = "Based on real orders";
      });
  }

  /* ------------------------------------------------------------------
     Search
     A flat index built once from MENU, independent of however the
     cards are grouped/laid out — search results are shown as their
     own simple vertical list, not the horizontal category rows.
     ------------------------------------------------------------------ */

  const searchIndex = [];
  MENU.forEach((group) => {
    group.items.forEach((item) => searchIndex.push({ item, category: group.category }));
  });

  function matchesQuery(item, q) {
    return (
      item.name.toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q)
    );
  }

  const searchInput = el("menuSearch");
  const searchClearBtn = el("searchClear");
  const searchResultsEl = el("searchResults");
  const customBlockEl = document.querySelector(".custom-block");

  function renderSearchResults(rawQuery) {
    const q = rawQuery.trim().toLowerCase();
    searchClearBtn.style.display = q ? "" : "none";

    if (!q) {
      searchResultsEl.style.display = "none";
      menuEl.style.display = "";
      if (customBlockEl) customBlockEl.style.display = "";
      return;
    }

    menuEl.style.display = "none";
    if (customBlockEl) customBlockEl.style.display = "none";
    searchResultsEl.style.display = "";

    const matches = searchIndex.filter(({ item }) => matchesQuery(item, q));
    el("searchCount").textContent = matches.length
      ? `${matches.length} dish${matches.length === 1 ? "" : "es"} found`
      : `No dishes found for "${rawQuery.trim()}"`;

    const list = el("searchList");
    list.innerHTML = "";

    matches.forEach(({ item, category }) => {
      const row = document.createElement("div");
      row.className = "search-row" + (item.soldOut ? " is-out" : "");

      const tap = document.createElement("button");
      tap.type = "button";
      tap.className = "search-row-tap";
      tap.setAttribute("aria-label", "See details for " + item.name);
      tap.onclick = () => openDetail(item);
      tap.appendChild(thumbnail(item));

      const body = document.createElement("div");
      body.className = "search-row-body";
      body.innerHTML =
        `<div class="search-row-cat">${esc(category)}</div>` +
        `<div class="search-row-name">${esc(item.name)}</div>` +
        `<div class="search-row-price">${money(item.price)}</div>`;
      tap.appendChild(body);
      row.appendChild(tap);

      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "search-row-plus";
      plus.disabled = !!item.soldOut;
      plus.dataset.item = item.name;
      plus.innerHTML =
        `<span class="search-row-plus-icon" aria-hidden="true">+</span>` +
        `<span class="search-row-badge" aria-hidden="true"></span>`;
      plus.setAttribute("aria-label", "Add " + item.name);
      plus.onclick = () => addToCart(item.name, item.name, item.price, item);
      row.appendChild(plus);

      list.appendChild(row);
    });

    updateSearchRowBadges();
  }

  /* One function, called every refresh() — rather than pushing a new
     closure per row into `controls` each time the results list rebuilds
     (which happens on every keystroke and would leak stale references
     to removed rows). It just re-reads whatever rows are in the DOM
     right now, however many that is. */
  function updateSearchRowBadges() {
    document.querySelectorAll(".search-row-plus[data-item]").forEach((btn) => {
      const line = cart.get(btn.dataset.item);
      const qty = line ? line.qty : 0;
      const badge = btn.querySelector(".search-row-badge");
      if (!badge) return;
      badge.textContent = qty > 0 ? String(qty) : "";
      badge.classList.toggle("is-visible", qty > 0);
    });
  }
  controls.push(updateSearchRowBadges);

  searchInput.addEventListener("input", () => renderSearchResults(searchInput.value));
  searchClearBtn.onclick = () => {
    searchInput.value = "";
    renderSearchResults("");
    searchInput.focus();
  };

  refresh();

  /* Quick reorder — remembered on this device only, no account needed.
     Only offered when the cart is currently empty, so it never competes
     with an order someone's already in the middle of building. */
  (function maybeShowReorderBanner() {
    if (cart.size > 0) return;
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem("fp_last_order") || "null");
    } catch {
      saved = null;
    }
    if (!saved || !saved.items || !saved.items.length) return;

    const total = saved.items.reduce((sum, l) => sum + l.unit * l.qty, 0);
    const count = saved.items.reduce((sum, l) => sum + l.qty, 0);

    const banner = document.createElement("div");
    banner.className = "reorder-banner";
    banner.innerHTML =
      `<div class="reorder-text">` +
      `<strong>Reorder your last order?</strong>` +
      `<span>${count} item${count === 1 ? "" : "s"} · ${money(total)}</span>` +
      `</div>` +
      `<button type="button" class="reorder-btn">Reorder</button>` +
      `<button type="button" class="reorder-dismiss" aria-label="Dismiss">×</button>`;

    banner.querySelector(".reorder-btn").onclick = () => {
      saved.items.forEach((l) => addToCart(l.key, l.name, l.unit, l.item, l.qty));
      if (saved.customNote) {
        customNote = saved.customNote;
        syncCustomOrderUI();
      }
      refresh();
      banner.remove();
      openSheet();
    };
    banner.querySelector(".reorder-dismiss").onclick = () => banner.remove();

    menuEl.parentNode.insertBefore(banner, menuEl);
  })();

  /* First-visit hint: nudge the very first scrollable row sideways
     once, so people notice it scrolls, without being naggy about it on
     every return visit. Skipped entirely if that row doesn't actually
     overflow (nothing to hint at). */
  if (!localStorage.getItem("fp_seen_scroll_hint")) {
    localStorage.setItem("fp_seen_scroll_hint", "1");
    const firstTrack = document.querySelector(".track");
    if (firstTrack && firstTrack.scrollWidth > firstTrack.clientWidth + 20) {
      setTimeout(() => {
        firstTrack.scrollTo({ left: 46, behavior: "smooth" });
        setTimeout(() => firstTrack.scrollTo({ left: 0, behavior: "smooth" }), 550);
      }, 900);
    }
  }
})();