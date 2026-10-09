const CACHE_NAME = "life-as-a-room-game-v6";
const CORE_ASSETS = [
  "/",
  "/room/layers/01_room_base.webp",
  "/room/layers/02_window.webp",
  "/room/layers/09a_calendar.webp",
  "/room/layers/09b_pinboard.webp",
  "/room/layers/09c_awards.webp",
  "/room/layers/09d_leaf_frame.webp",
  "/room/layers/04a_rug.webp",
  "/room/layers/03_bed.webp",
  "/room/layers/04b_desk.webp",
  "/room/layers/05_bookshelf.webp",
  "/room/layers/06_mirror.webp",
  "/room/layers/07a_plant_shelf.webp",
  "/room/layers/07b_plant_hanging.webp",
  "/room/layers/07e_plant_window.webp",
  "/room/layers/07f_plant_floor.webp",
  "/characters/girl.png",
  "/characters/boy.png",
  "/icon.svg",
  "/icon-maskable.svg",
  "/onboarding/fonts/A-Kalam-Regular.ttf",
  "/onboarding/fonts/B-RockSalt-Regular.ttf",
  "/onboarding/notes/leaf-note.png",
  "/onboarding/notes/note-paper-overlap.png",
  "/onboarding/objects/envelope-3f.png",
  "/onboarding/objects/net-sweep-8f.png",
  "/onboarding/pet/pet-flutter-8f.png",
  "/onboarding/pet/pet-footprint-8.png",
  "/onboarding/pet/pet-threatening-shadow.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/"))),
  );
});
