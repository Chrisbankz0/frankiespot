/* =====================================================================
   SERVICE WORKER — receives push notifications while the site isn't
   open in a tab, focuses/opens the site when one is tapped, and (just
   by existing and being registered) is what makes the site installable
   as a home-screen app icon — see manifest.json.

   Registered from app.js on every visit, not just for people who opt
   into push notifications, so "Add to Home Screen" works for everyone.
   ===================================================================== */

/* No actual caching — every request just goes straight to the network,
   exactly as it would with no service worker at all. This handler
   exists only because some browsers' install criteria look for one;
   it changes nothing about how the site loads or behaves. */
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = {};
  }

  const title = data.title || "Frankies Pot";
  const options = {
    body: data.body || "We're open now — order your food today.",
    icon: data.icon || "images/logo.jpg",
    badge: data.icon || "images/logo.jpg",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        /* Same-origin tab already open — focus it rather than opening a
           duplicate. Exact URL match isn't required; being on the site
           at all is close enough for a notification tap. */
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
