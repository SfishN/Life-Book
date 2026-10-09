import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
registerHooks({
  resolve(specifier, context, nextResolve) {
    let candidate;
    if (specifier.startsWith("@/")) candidate = path.join(root, "src", specifier.slice(2));
    else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      candidate = fileURLToPath(new URL(specifier, context.parentURL));
    }
    if (candidate && !path.extname(candidate) && existsSync(candidate + ".ts")) {
      return nextResolve(pathToFileURL(candidate + ".ts").href, context);
    }
    return nextResolve(specifier, context);
  },
});

// A deliberately isolated test storage, never the user's browser or real records.
const saved = new Map();
let rejectWrites = false;
const testStorage = {
  getItem: (key) => saved.get(key) ?? null,
  setItem: (key, value) => {
    if (rejectWrites) throw new DOMException("Storage full", "QuotaExceededError");
    saved.set(key, value);
  },
  removeItem: (key) => saved.delete(key),
};
Object.defineProperty(globalThis, "localStorage", { value: testStorage, configurable: true });
Object.defineProperty(globalThis, "window", { value: { localStorage: testStorage }, configurable: true });

const { commitDiary, validateDiary } = await import("../src/domain/diary.ts");
const { WEATHER_OPTIONS, WEATHER_PRESETS, normalizeWeather, getWeatherPreset } = await import("../src/domain/weather.ts");
const { useLifeRoomStore: store, GAME_STORAGE_KEY, getLifeRoomSnapshot } = await import("../src/store/useLifeRoomStore.ts");
const {
  ONBOARDING_STORAGE_KEY,
  createOnboardingState,
  moveOnboardingTo,
  readOnboardingState,
  setGuidanceMode,
  writeOnboardingState,
} = await import("../src/domain/onboarding.ts");

const neutral = () => ({ diary: [], atmosphere: { weather: "not-recorded", sourceEntryId: null, sourceDate: null, revision: 0 } });
const input = (weather = "sunny", date = "2026-08-30") => ({ title: "A quiet walk", body: "I noticed the light on my walk.", date, weather });
const firstTime = "2026-08-30T10:00:00.000Z";
const secondTime = "2026-08-30T11:00:00.000Z";

beforeEach(() => {
  rejectWrites = false;
  saved.clear();
  saved.set("life-as-a-room-v1", "original-room-records");
  store.getState().resetDemo();
});

test("six weather choices plus Not recorded have distinct lighting", () => {
  assert.deepEqual(WEATHER_OPTIONS.map((item) => item.value), ["not-recorded", "sunny", "cloudy", "rainy", "snowy", "foggy", "stormy"]);
  assert.equal(new Set(WEATHER_OPTIONS.map((item) => JSON.stringify([item.tint, item.ambientColor, item.windowAlpha, item.lampAlpha]))).size, 7);
  assert.ok(WEATHER_PRESETS.sunny.windowAlpha > WEATHER_PRESETS.cloudy.windowAlpha);
  assert.ok(WEATHER_PRESETS.stormy.lampAlpha > WEATHER_PRESETS.sunny.lampAlpha);
  assert.match(WEATHER_PRESETS.stormy.description, /No flashes/);
});

test("missing and unexpected weather safely use neutral light", () => {
  for (const value of [undefined, null, "", "hail", "__proto__", 12]) {
    assert.equal(normalizeWeather(value), "not-recorded");
    assert.equal(getWeatherPreset(value), WEATHER_PRESETS["not-recorded"]);
  }
});

test("unsaved draft and weather changes never mutate committed state", () => {
  const state = neutral();
  const before = structuredClone(state);
  const draft = input("rainy");
  draft.body = "An unsaved edit";
  draft.weather = "stormy";
  validateDiary(draft);
  assert.deepEqual(state, before);
  assert.equal(store.getState().atmosphere.revision, 0);
});

test("save commits one diary and matching atmosphere without mutating the input state", () => {
  const state = neutral();
  const result = commitDiary(state, input("rainy"), "entry-1", firstTime);
  assert.equal(result.diary.length, 1);
  assert.equal(result.diary[0].weather, "rainy");
  assert.deepEqual(result.atmosphere, { weather: "rainy", sourceEntryId: "entry-1", sourceDate: "2026-08-30", revision: 1 });
  assert.deepEqual(state, neutral());
});

test("every supported weather can be saved", () => {
  for (const option of WEATHER_OPTIONS) {
    const result = commitDiary(neutral(), input(option.value), "entry-1", firstTime);
    assert.equal(result.diary[0].weather, option.value);
    assert.equal(result.atmosphere.weather, option.value);
  }
});

test("editing preserves identity and creation time, without duplicating entries", () => {
  const initial = commitDiary(neutral(), input(), "entry-1", firstTime);
  const edited = commitDiary(initial, { ...input("snowy"), body: "A revised memory." }, "entry-1", secondTime, true);
  assert.equal(edited.diary.length, 1);
  assert.equal(edited.diary[0].id, "entry-1");
  assert.equal(edited.diary[0].createdAt, firstTime);
  assert.equal(edited.diary[0].updatedAt, secondTime);
  assert.equal(edited.atmosphere.weather, "snowy");
  assert.equal(edited.atmosphere.revision, 2);
});

test("an edit cannot silently recreate a missing entry", () => {
  assert.throws(() => commitDiary(neutral(), input(), "missing", firstTime, true), /no longer available/);
});

test("saving unchanged weather still increments visual feedback", () => {
  const initial = commitDiary(neutral(), input(), "entry-1", firstTime);
  const edited = commitDiary(initial, input(), "entry-1", secondTime, true);
  assert.equal(edited.atmosphere.weather, "sunny");
  assert.equal(edited.atmosphere.revision, initial.atmosphere.revision + 1);
});

test("the latest save, not the latest date, controls room lighting", () => {
  const current = commitDiary(neutral(), input("sunny"), "today", firstTime);
  const older = commitDiary(current, input("stormy", "2026-01-02"), "older", secondTime);
  assert.equal(older.atmosphere.weather, "stormy");
  assert.equal(older.atmosphere.sourceDate, "2026-01-02");
  const edited = commitDiary(older, input("foggy"), "today", secondTime, true);
  assert.equal(edited.diary[0].id, "older");
  assert.equal(edited.atmosphere.sourceEntryId, "today");
  assert.equal(edited.atmosphere.weather, "foggy");
});

test("same-day entries follow last successful save", () => {
  const a = commitDiary(neutral(), input("sunny"), "a", firstTime);
  const b = commitDiary(a, input("rainy"), "b", secondTime);
  assert.equal(b.diary.length, 2);
  assert.equal(b.atmosphere.sourceEntryId, "b");
  assert.equal(b.atmosphere.weather, "rainy");
});

test("empty bodies and invalid dates fail without changing state", () => {
  const state = neutral();
  assert.throws(() => commitDiary(state, { ...input(), body: "  \n " }, "a", firstTime), /Write a moment/);
  for (const date of ["", "not-a-date", "2026-02-31", "2026-13-01", "2026-2-1"]) {
    assert.throws(() => commitDiary(state, input("sunny", date), "a", firstTime), /valid date/);
  }
  assert.deepEqual(state, neutral());
  assert.equal(validateDiary(input("sunny", "2024-02-29")).date, "2024-02-29");
});

test("optional title and weather use truthful defaults", () => {
  const entry = validateDiary({ ...input(), title: " ", weather: undefined });
  assert.equal(entry.title, entry.body);
  assert.equal(entry.weather, "not-recorded");
});

test("actual store persists diary and atmosphere under its own namespace", () => {
  store.getState().addDiary(input("rainy"));
  const persisted = JSON.parse(saved.get(GAME_STORAGE_KEY));
  assert.equal(persisted.state.diary[0].weather, "rainy");
  assert.equal(persisted.state.atmosphere.weather, "rainy");
  assert.equal(persisted.state.atmosphere.sourceEntryId, persisted.state.diary[0].id);
  assert.equal(saved.get("life-as-a-room-v1"), "original-room-records");
});

test("rehydration restores the last saved atmosphere and source date", async () => {
  store.getState().addDiary(input("sunny"));
  store.getState().addDiary(input("rainy", "2026-01-02"));
  const serialized = saved.get(GAME_STORAGE_KEY);
  store.setState(neutral());
  saved.set(GAME_STORAGE_KEY, serialized);
  await store.persist.rehydrate();
  assert.equal(store.getState().diary.length, 2);
  assert.equal(store.getState().atmosphere.weather, "rainy");
  assert.equal(store.getState().atmosphere.sourceDate, "2026-01-02");
});

test("failed persistence leaves the actual store and room unchanged", () => {
  const before = getLifeRoomSnapshot();
  rejectWrites = true;
  assert.throws(() => store.getState().addDiary(input("stormy")), /Storage full/);
  assert.deepEqual(getLifeRoomSnapshot(), before);
  rejectWrites = false;
});

test("diary evidence never silently awards skill progress or achievements", () => {
  const skill = store.getState().skills[0];
  store.getState().addDiary({ ...input(), skillId: skill.id });
  assert.equal(store.getState().skills[0].progress, 0);
  assert.equal(store.getState().diary[0].skillId, skill.id);
  assert.deepEqual(store.getState().achievements, []);
});

test("all retained record functions work independently of removed modules", () => {
  store.getState().setHero({ name: "Alex", gender: "male", currentTheme: "Learning", reflection: "Keep trying" });
  store.getState().addSkill("Drawing");
  const skill = store.getState().skills.at(-1);
  store.getState().updateSkill(skill.id, { progress: 40 });
  store.getState().addAchievement({ title: "First sketch", description: "I made something.", confirmed: true });
  store.getState().addGuideMessage({ role: "user", content: "I made a sketch." });
  store.getState().saveChapter({ title: "A beginning", body: "Alex started drawing.", period: "2026-08", approved: true });
  const snapshot = getLifeRoomSnapshot();
  assert.equal(snapshot.hero.name, "Alex");
  assert.equal(snapshot.skills.at(-1).progress, 40);
  assert.equal(snapshot.achievements[0].confirmed, true);
  assert.equal(snapshot.guideMessages.at(-1).role, "user");
  assert.equal(snapshot.chapters[0].approved, true);
  for (const key of ["todos", "quests", "events", "annotations"]) assert.equal(key in snapshot, false);
});

test("old profiles default to the girl and saved gender selects the boy", async () => {
  const oldProfile = { name: "Alex", pronouns: "they/them", currentTheme: "Learning", reflection: "Keep trying" };
  saved.set(GAME_STORAGE_KEY, JSON.stringify({
    state: { ...getLifeRoomSnapshot(), hero: oldProfile }, version: 0,
  }));
  await store.persist.rehydrate();
  assert.deepEqual(store.getState().hero, { name: "Alex", gender: "female", currentTheme: "Learning", reflection: "Keep trying" });
  assert.equal(JSON.parse(saved.get(GAME_STORAGE_KEY)).version, 1);
  assert.equal("pronouns" in JSON.parse(saved.get(GAME_STORAGE_KEY)).state.hero, false);
  store.getState().setHero({ ...store.getState().hero, gender: "male" });
  assert.equal(getLifeRoomSnapshot().hero.gender, "male");
  assert.equal("pronouns" in getLifeRoomSnapshot().hero, false);
});

test("navigation and hotspots contain exactly the six selected functions", () => {
  for (const file of ["src/components/LifeRoomApp.tsx", "src/room/RoomGame.tsx"]) {
    const source = readFileSync(path.join(root, file), "utf8");
    const ids = [...source.matchAll(/\{ id: "([a-z]+)", label:/g)].map((match) => match[1]);
    assert.deepEqual(ids.sort(), ["achievements", "diary", "guide", "hero", "novel", "skills"]);
  }
});

test("onboarding progress uses a separate namespace and preserves game records", () => {
  store.getState().addDiary(input("rainy"));
  const recordsBefore = saved.get(GAME_STORAGE_KEY);
  const inProgress = moveOnboardingTo(createOnboardingState(), "net");
  writeOnboardingState(testStorage, inProgress);
  assert.equal(readOnboardingState(testStorage).step, "net");
  assert.equal(saved.get(GAME_STORAGE_KEY), recordsBefore);
  assert.notEqual(ONBOARDING_STORAGE_KEY, GAME_STORAGE_KEY);
});

test("onboarding replay, completion, and guidance mode remain explicit", () => {
  const fresh = createOnboardingState();
  assert.deepEqual({ status: fresh.status, step: fresh.step, guidanceMode: fresh.guidanceMode }, { status: "not-started", step: "arrival", guidanceMode: "nudge" });
  const led = setGuidanceMode(fresh, "lead");
  assert.equal(led.guidanceMode, "lead");
  assert.equal(led.step, "arrival");
  const complete = moveOnboardingTo(led, "complete");
  assert.equal(complete.status, "complete");
  assert.ok(complete.completedAt);
});

test("malformed onboarding storage safely returns a first-run state", () => {
  saved.set(ONBOARDING_STORAGE_KEY, "not-json");
  assert.equal(readOnboardingState(testStorage).step, "arrival");
  saved.set(ONBOARDING_STORAGE_KEY, JSON.stringify({ version: 99, status: "complete", step: "complete" }));
  assert.equal(readOnboardingState(testStorage).status, "not-started");
});

test("runtime onboarding assets are present without replacing source materials", () => {
  for (const asset of [
    "objects/envelope-3f.png",
    "objects/net-sweep-8f.png",
    "notes/leaf-note.png",
    "notes/note-paper-overlap.png",
    "pet/pet-flutter-8f.png",
    "pet/pet-footprint-8.png",
    "pet/pet-threatening-shadow.png",
  ]) {
    assert.ok(existsSync(path.join(root, "basics/settings", asset)), `source ${asset} exists`);
    assert.ok(existsSync(path.join(root, "public/onboarding", asset)), `runtime ${asset} exists`);
  }
});

test("the game uses port 3001 locally and Vercel-compatible generated output", () => {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  assert.match(pkg.scripts.dev, /--port 3001/);
  assert.match(pkg.scripts.start, /--port 3001/);
  assert.match(
    readFileSync(path.join(root, "next.config.ts"), "utf8"),
    /distDir: process\.env\.VERCEL \? "\.next" : "\.next-game"/,
  );
});
