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

  const subtotal = () =>
    [...cart.values()].reduce((sum, l) => sum + l.unit * l.qty, 0);

  const itemCount = () =>
    [...cart.values()].reduce((sum, l) => sum + l.qty, 0);

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

  MENU.forEach((group) => {
    const secId = "group-" + slug(group.category);

    const pill = document.createElement("button");
    pill.type = "button";
    pill.textContent = group.category;
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

    group.items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "card" + (item.soldOut ? " is-out" : "");

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
      plus.textContent = "+";
      plus.setAttribute("aria-label", "Add " + item.name);
      plus.onclick = () => {
        /* A dish with size/base choices can't be added blind from the
           card — open the detail view so the choice gets made first. */
        if (item.sizes && item.sizes.length) { openDetail(item); return; }
        addToCart(item.name, item.name, item.price, item);
      };
      media.appendChild(plus);

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

      track.appendChild(card);
    });

    menuEl.appendChild(section);
  });

  /* ------------------------------------------------------------------
     Cart bar and order sheet
     ------------------------------------------------------------------ */

  const bar = el("cartBar");
  const sheet = el("sheet");
  const scrim = el("scrim");
  const sendBtn = el("sendBtn");
  let lastFocused = null;

  function refresh() {
    const count = itemCount();
    el("barCount").textContent = count;
    el("barTotal").textContent = money(subtotal());
    bar.classList.toggle("is-visible", count > 0);

    controls.forEach((render) => render());

    if (sheet.classList.contains("is-open")) {
      if (cart.size === 0) closeSheet();
      else renderSheet();
    }
  }

  function openSheet() {
    lastFocused = document.activeElement;
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
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheet.classList.contains("is-open")) closeSheet();
  });

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

    if (cart.size === 0) {
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

    const sub = subtotal();
    const shortfall = (BUSINESS.minimumOrder || 0) - sub;
    const belowMinimum = cart.size > 0 && shortfall > 0;

    el("noticeSlot").innerHTML = belowMinimum
      ? `<div class="notice">Add ${money(shortfall)} more to reach the ${money(BUSINESS.minimumOrder)} minimum order.</div>`
      : "";

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

    el("clearBtn").style.visibility = cart.size ? "visible" : "hidden";
    sendBtn.disabled = cart.size === 0 || belowMinimum;
  }

  /* ------------------------------------------------------------------
     WhatsApp handoff
     Builds the order as a text message and opens it in a chat with the
     number in BUSINESS.whatsapp, ready for the customer to send.
     ------------------------------------------------------------------ */

  function buildMessage() {
    const sub = subtotal();
    const out = [`*New order — ${BUSINESS.name}*`, ""];

    cart.forEach((line) => {
      out.push(`${line.qty}\u00D7 ${line.name} — ${money(line.unit * line.qty)}`);
    });

    out.push("", `Subtotal: ${money(sub)}`);

    if (BUSINESS.deliveryFee != null) {
      out.push(`Delivery: ${money(BUSINESS.deliveryFee)}`);
      out.push(`*Total: ${money(sub + BUSINESS.deliveryFee)}*`);
    }

    out.push("", "Name:", "Delivery address:", "Preferred time:");
    return out.join("\n");
  }

  sendBtn.onclick = () => {
    if (cart.size === 0) return;
    const url =
      "https://wa.me/" + BUSINESS.whatsapp + "?text=" + encodeURIComponent(buildMessage());
    window.open(url, "_blank", "noopener");
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

  refresh();
})();