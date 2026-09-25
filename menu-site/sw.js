/* =====================================================================
   SERVICE WORKER — only exists to receive push notifications while the
   site isn't open in a tab, and to focus/open the site when one of
   those notifications is tapped.

   Registered from app.js when a customer opts in via the "Notify me
   when you're open" banner. Does nothing else — no offline caching, no
   asset interception.
   ===================================================================== */

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
