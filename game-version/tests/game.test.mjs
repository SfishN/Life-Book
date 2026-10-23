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
    else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) candidate = fileURLToPath(new URL(specifier, context.parentURL));
    if (candidate && !path.extname(candidate) && existsSync(candidate + ".ts")) return nextResolve(pathToFileURL(candidate + ".ts").href, context);
    return nextResolve(specifier, context);
  },
});

// Isolated test storage, never the user's browser records.
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
const { MOOD_OPTIONS, MOOD_PRESETS, normalizeMood, getMoodPreset } = await import("../src/domain/mood.ts");
const { useLifeRoomStore: store, GAME_STORAGE_KEY, getLifeRoomSnapshot, guideMessagesForToday } = await import("../src/store/useLifeRoomStore.ts");
const {
  FINAL_NOTE_ORDER,
  ONBOARDING_STORAGE_KEY,
  createOnboardingState,
  markFinalNoteRead,
  moveOnboardingTo,
  readOnboardingState,
  setGuidanceMode,
  writeOnboardingState,
} = await import("../src/domain/onboarding.ts");
const { getPanelAccess } = await import("../src/onboarding/roomCues.ts");

const neutral = () => ({ diary: [], atmosphere: { mood: "neutral", sourceEntryId: null, sourceDate: null, revision: 0 } });
const diaryInput = (mood = "calm", date = "2026-10-17") => ({ title: "A quiet walk", body: "I noticed the light on my walk.", date, mood, relatedSkillIds: [] });
const firstTime = "2026-10-17T10:00:00.000Z";
const secondTime = "2026-10-17T11:00:00.000Z";

beforeEach(() => {
  rejectWrites = false;
  saved.clear();
  saved.set("life-as-a-room-game-v1", "discarded-old-records");
  store.getState().resetDemo();
});

test("the five moods have distinct room-light presets", () => {
  assert.deepEqual(MOOD_OPTIONS.map((item) => item.value), ["calm", "happy", "neutral", "tired", "stressed"]);
  assert.equal(new Set(MOOD_OPTIONS.map((item) => JSON.stringify([item.tint, item.ambientColor, item.ambientAlpha, item.windowColor, item.windowAlpha, item.lampAlpha]))).size, 5);
  assert.ok(MOOD_PRESETS.happy.windowAlpha > MOOD_PRESETS.tired.windowAlpha);
  assert.ok(MOOD_PRESETS.stressed.lampAlpha > MOOD_PRESETS.happy.lampAlpha);
});

test("missing and unexpected moods safely use neutral light", () => {
  for (const value of [undefined, null, "", "stormy", "__proto__", 12]) {
    assert.equal(normalizeMood(value), "neutral");
    assert.equal(getMoodPreset(value), MOOD_PRESETS.neutral);
  }
});

test("unsaved diary drafts do not mutate committed state", () => {
  const state = neutral();
  const before = structuredClone(state);
  const draft = diaryInput("tired");
  draft.body = "An unsaved edit";
  draft.mood = "stressed";
  validateDiary(draft);
  assert.deepEqual(state, before);
  assert.equal(store.getState().atmosphere.revision, 0);
});

test("save commits one diary and its mood-driven atmosphere atomically", () => {
  const state = neutral();
  const result = commitDiary(state, diaryInput("tired"), "entry-1", firstTime);
  assert.equal(result.diary.length, 1);
  assert.equal(result.diary[0].mood, "tired");
  assert.deepEqual(result.atmosphere, { mood: "tired", sourceEntryId: "entry-1", sourceDate: "2026-10-17", revision: 1 });
  assert.deepEqual(state, neutral());
});

test("every supported mood can be saved", () => {
  for (const option of MOOD_OPTIONS) {
    const result = commitDiary(neutral(), diaryInput(option.value), "entry-1", firstTime);
    assert.equal(result.diary[0].mood, option.value);
    assert.equal(result.atmosphere.mood, option.value);
  }
});

test("editing preserves identity and creation time without duplicates", () => {
  const initial = commitDiary(neutral(), diaryInput(), "entry-1", firstTime);
  const edited = commitDiary(initial, { ...diaryInput("happy"), body: "A revised memory." }, "entry-1", secondTime, true);
  assert.equal(edited.diary.length, 1);
  assert.equal(edited.diary[0].id, "entry-1");
  assert.equal(edited.diary[0].createdAt, firstTime);
  assert.equal(edited.diary[0].updatedAt, secondTime);
  assert.equal(edited.atmosphere.mood, "happy");
  assert.equal(edited.atmosphere.revision, 2);
});

test("an edit cannot silently recreate a missing diary", () => {
  assert.throws(() => commitDiary(neutral(), diaryInput(), "missing", firstTime, true), /no longer available/);
});

test("the latest successful save, not latest date, controls lighting", () => {
  const current = commitDiary(neutral(), diaryInput("happy"), "today", firstTime);
  const older = commitDiary(current, diaryInput("stressed", "2026-01-02"), "older", secondTime);
  assert.equal(older.atmosphere.mood, "stressed");
  assert.equal(older.atmosphere.sourceDate, "2026-01-02");
});

test("invalid diary bodies and dates fail without changing state", () => {
  const state = neutral();
  assert.throws(() => commitDiary(state, { ...diaryInput(), body: "  \n " }, "a", firstTime), /Write a moment/);
  for (const date of ["", "not-a-date", "2026-02-31", "2026-13-01", "2026-2-1"]) assert.throws(() => commitDiary(state, diaryInput("calm", date), "a", firstTime), /valid date/);
  assert.deepEqual(state, neutral());
});

test("optional title and mood use truthful defaults", () => {
  const entry = validateDiary({ ...diaryInput(), title: " ", mood: undefined });
  assert.equal(entry.title, entry.body);
  assert.equal(entry.mood, "neutral");
});

test("records persist under the new Life Room namespace only", () => {
  store.getState().addDiary(diaryInput("tired"));
  const persisted = JSON.parse(saved.get(GAME_STORAGE_KEY));
  assert.equal(GAME_STORAGE_KEY, "life-room-v1");
  assert.equal(persisted.state.diary[0].mood, "tired");
  assert.equal(persisted.state.atmosphere.mood, "tired");
  assert.equal(saved.get("life-as-a-room-game-v1"), "discarded-old-records");
});

test("rehydration restores the last mood and source date", async () => {
  store.getState().addDiary(diaryInput("happy"));
  store.getState().addDiary(diaryInput("stressed", "2026-01-02"));
  const serialized = saved.get(GAME_STORAGE_KEY);
  store.setState({ diary: [], atmosphere: neutral().atmosphere });
  saved.set(GAME_STORAGE_KEY, serialized);
  await store.persist.rehydrate();
  assert.equal(store.getState().diary.length, 2);
  assert.equal(store.getState().atmosphere.mood, "stressed");
  assert.equal(store.getState().atmosphere.sourceDate, "2026-01-02");
});

test("failed diary persistence leaves store and room unchanged", () => {
  const before = getLifeRoomSnapshot();
  rejectWrites = true;
  assert.throws(() => store.getState().addDiary(diaryInput("stressed")), /Storage full/);
  assert.deepEqual(getLifeRoomSnapshot(), before);
  rejectWrites = false;
});

test("skill records are separate evidence for skill progress", () => {
  const skill = store.getState().skills[0];
  store.getState().addDiary({ ...diaryInput(), relatedSkillIds: [skill.id] });
  assert.equal(store.getState().skillRecords.length, 0);
  store.getState().addSkillRecord({ skillId: skill.id, date: "2026-10-17", practice: "Five minutes of quiet breathing", durationMinutes: 5, feeling: "steady", linkedDiaryEntryId: store.getState().diary[0].id });
  assert.equal(store.getState().skillRecords.length, 1);
  assert.equal(store.getState().skillRecords[0].linkedDiaryEntryId, store.getState().diary[0].id);
  assert.equal(store.getState().achievements.length, 0);
});

test("profile, achievements, guidance, and chapters remain user-controlled", () => {
  store.getState().setHero({ ...store.getState().hero, name: "Alex", gender: "non-binary", motto: "Keep noticing." });
  store.getState().addAttribute("Courage", "#c89999");
  store.getState().addAchievement({ title: "First reflection", excerpt: "I noticed a small change.", sourceType: "manual", status: "pinned" });
  store.getState().addGuideMessage({ role: "user", content: "Help me reflect.", mode: "local", includedRoomRecords: false });
  const chapterId = store.getState().saveChapter({ chapterNumber: 1, title: "A beginning", body: "Alex started noticing ordinary days.", startDate: "2026-10-01", endDate: "2026-10-17", sourceRefs: [], status: "draft", generationMode: "local", generatedAt: firstTime, approvedAt: null });
  store.getState().approveChapter(chapterId);
  const snapshot = getLifeRoomSnapshot();
  assert.equal(snapshot.hero.name, "Alex");
  assert.equal(snapshot.attributes.at(-1).name, "Courage");
  assert.equal(snapshot.achievements[0].status, "pinned");
  assert.equal(snapshot.guideMessages.at(-1).includedRoomRecords, false);
  assert.equal(snapshot.chapters[0].status, "approved");
});

test("room character appearance is derived from gender", () => {
  const cases = [
    ["male", "girl", "boy"],
    ["female", "boy", "girl"],
    ["non-binary", "boy", "girl"],
    ["prefer-not-to-say", "boy", "girl"],
  ];
  for (const [gender, suppliedAvatar, expectedAvatar] of cases) {
    store.getState().setHero({ ...store.getState().hero, gender, avatarStyle: suppliedAvatar });
    assert.equal(store.getState().hero.avatarStyle, expectedAvatar);
  }
  const profile = readFileSync(path.join(root, "src/furniture/panels/ProfilePanel.tsx"), "utf8");
  assert.doesNotMatch(profile, /Room avatar/);
  assert.doesNotMatch(profile, /Girl sprite|Boy sprite/);
});

test("little crow conversation keeps only the current local day", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  store.setState({
    guideMessages: [{
      id: "old-message",
      role: "assistant",
      content: "An older reply.",
      createdAt: yesterday.toISOString(),
      mode: "local",
      includedRoomRecords: false,
    }],
  });
  store.getState().addGuideMessage({ role: "user", content: "A new question.", includedRoomRecords: false });
  assert.equal(store.getState().guideMessages.length, 1);
  assert.equal(store.getState().guideMessages[0].content, "A new question.");
  assert.deepEqual(guideMessagesForToday(store.getState().guideMessages), store.getState().guideMessages);
});

test("AI companion belongs to the little crow rather than the mirror panel", () => {
  const app = readFileSync(path.join(root, "src/components/LifeRoomApp.tsx"), "utf8");
  const furniture = readFileSync(path.join(root, "src/furniture/FurniturePanel.tsx"), "utf8");
  const panel = readFileSync(path.join(root, "src/furniture/panels/GuidePanel.tsx"), "utf8");
  const room = readFileSync(path.join(root, "src/room/RoomGame.tsx"), "utf8");
  const route = readFileSync(path.join(root, "src/app/api/guide/route.ts"), "utf8");
  assert.match(app, /object: "Little Crow"/);
  assert.match(furniture, /panel === "guide"[\s\S]*<GuidePanel onClose=\{onClose\}/);
  assert.match(panel, /crow-companion-backdrop/);
  assert.match(panel, /kept until<br \/>midnight/);
  assert.match(room, /\{ id: "guide", label: "Little Crow"/);
  assert.doesNotMatch(room, /\{ id: "guide", label: "Mirror Guide"/);
  assert.match(route, /55 words/);
});

test("companion typing is isolated from room controls and introduction movement is faster", () => {
  const panel = readFileSync(path.join(root, "src/furniture/panels/GuidePanel.tsx"), "utf8");
  const room = readFileSync(path.join(root, "src/room/RoomGame.tsx"), "utf8");
  assert.match(panel, /onKeyDown=\{keepTypingInCompanion\}/);
  assert.match(panel, /onKeyUp=\{keepTypingInCompanion\}/);
  assert.match(panel, /event\.stopPropagation\(\)/);
  assert.doesNotMatch(room, /createCursorKeys\(/);
  assert.match(room, /KeyCodes\.UP, false/);
  assert.match(room, /INTRODUCTION_WALK_SPEED = 420/);
  assert.match(room, /onboardingStep === "complete" \? ROOM_WALK_SPEED : INTRODUCTION_WALK_SPEED/);
});

test("navigation and hotspots contain exactly six functions", () => {
  for (const file of ["src/components/LifeRoomApp.tsx", "src/room/RoomGame.tsx"]) {
    const source = readFileSync(path.join(root, file), "utf8");
    const ids = [...source.matchAll(/\{ id: "([a-z]+)", label:/g)].map((match) => match[1]);
    assert.deepEqual(ids.sort(), ["achievements", "diary", "guide", "hero", "novel", "skills"]);
  }
});

test("mobile controls provide a two-circle virtual joystick wired to room movement", () => {
  const app = readFileSync(path.join(root, "src/components/LifeRoomApp.tsx"), "utf8");
  const joystick = readFileSync(path.join(root, "src/components/VirtualJoystick.tsx"), "utf8");
  const room = readFileSync(path.join(root, "src/room/RoomGame.tsx"), "utf8");
  const css = readFileSync(path.join(root, "src/app/globals.css"), "utf8");
  assert.match(app, /<VirtualJoystick \/>/);
  assert.match(joystick, /life-room:virtual-move/);
  assert.match(room, /addEventListener\("life-room:virtual-move"/);
  assert.match(room, /updatePinchZoom\(\)/);
  assert.match(room, /Pinch with two fingers to zoom/);
  assert.match(css, /@media \(max-width: 620px\), \(pointer: coarse\) \{\s*\.virtual-joystick \{\s*display: block;/);
  assert.doesNotMatch(joystick, /virtual-joystick-ring/);
});

test("mobile introduction can catch crossings from the bottom interaction prompt", () => {
  const app = readFileSync(path.join(root, "src/components/LifeRoomApp.tsx"), "utf8");
  const room = readFileSync(path.join(root, "src/room/RoomGame.tsx"), "utf8");
  const css = readFileSync(path.join(root, "src/app/globals.css"), "utf8");
  assert.match(app, /dispatchEvent\(new CustomEvent\("life-room:interact"\)\)/);
  assert.match(room, /addEventListener\("life-room:interact", this\.onInteractCommand\)/);
  assert.match(room, /JustDown\(this\.keys\.interact\)\) this\.performCurrentInteraction\(\)/);
  assert.match(room, /this\.onboardingStep === "net"\) \{\s*this\.sweepNet\(\)/);
  assert.match(room, /this\.coarsePointer \? 330 : 235/);
  assert.match(room, /this\.coarsePointer \? 3200 : 6500/);
  assert.match(css, /@media \(hover: none\), \(pointer: coarse\)/);
  assert.match(css, /\.touch-interact-label \{\s*display: inline-flex;/);
});

test("pinch zoom expands the room viewport and keeps two-axis camera movement bounded", () => {
  const room = readFileSync(path.join(root, "src/room/RoomGame.tsx"), "utf8");
  assert.match(room, /mode: Phaser\.Scale\.RESIZE/);
  assert.match(room, /Math\.min\(viewportWidth \/ ROOM_WORLD_WIDTH, viewportHeight \/ ROOM_WORLD_HEIGHT\)/);
  assert.match(room, /verticalFillZoom \* CAMERA_OVERSCAN_AFTER_VERTICAL_FILL/);
  assert.match(room, /this\.cameraCenter\.x = halfViewWidth >= ROOM_WORLD_WIDTH \/ 2/);
  assert.match(room, /this\.cameraCenter\.y = halfViewHeight >= ROOM_WORLD_HEIGHT \/ 2/);
  assert.match(room, /this\.cameraCenter\.x -= \(pointer\.x - this\.panLast\.x\) \/ camera\.zoom/);
  assert.match(room, /this\.cameraCenter\.y -= \(pointer\.y - this\.panLast\.y\) \/ camera\.zoom/);
  assert.match(room, /CAMERA_PAN_THRESHOLD = 10/);
  assert.doesNotMatch(room, /setZoom\(zoom\)\.centerOn\(768, 512\)/);
});

test("onboarding uses a new namespace and preserves Life Room records", () => {
  store.getState().addDiary(diaryInput("tired"));
  const recordsBefore = saved.get(GAME_STORAGE_KEY);
  writeOnboardingState(testStorage, moveOnboardingTo(createOnboardingState(), "net"));
  assert.equal(ONBOARDING_STORAGE_KEY, "life-room-onboarding-v1");
  assert.equal(readOnboardingState(testStorage).step, "net");
  assert.equal(saved.get(GAME_STORAGE_KEY), recordsBefore);
});

test("onboarding completion and guidance mode remain explicit", () => {
  const fresh = createOnboardingState();
  assert.deepEqual({ status: fresh.status, step: fresh.step, guidanceMode: fresh.guidanceMode }, { status: "not-started", step: "arrival", guidanceMode: "nudge" });
  const led = setGuidanceMode(fresh, "lead");
  assert.equal(led.guidanceMode, "lead");
  const complete = moveOnboardingTo(led, "complete");
  assert.equal(complete.status, "complete");
  assert.ok(complete.completedAt);
});

test("finished furniture opens during the remaining introduction while later furniture stays locked", () => {
  assert.equal(getPanelAccess("arrival", "diary"), "locked");
  assert.equal(getPanelAccess("diary", "diary"), "explore");
  assert.equal(getPanelAccess("diary", "skills"), "locked");
  assert.equal(getPanelAccess("skills", "diary"), "open");
  assert.equal(getPanelAccess("skills", "skills"), "explore");
  assert.equal(getPanelAccess("profile", "hero"), "explore");
  assert.equal(getPanelAccess("achievements", "hero"), "open");
  assert.equal(getPanelAccess("novel", "achievements"), "open");
  assert.equal(getPanelAccess("companion", "novel"), "open");
  assert.equal(getPanelAccess("companion", "guide"), "explore");
  assert.equal(getPanelAccess("reveal", "guide"), "open");
  for (const panel of ["diary", "skills", "hero", "achievements", "novel", "guide"]) {
    assert.equal(getPanelAccess("complete", panel), "open");
  }
});

test("three final notes can be read from their positions in any order", () => {
  assert.deepEqual(FINAL_NOTE_ORDER, ["reveal", "crow", "adoption"]);
  let progress = moveOnboardingTo(createOnboardingState(), "reveal");
  for (const note of ["adoption", "reveal", "crow"]) {
    progress = markFinalNoteRead(progress, note);
    writeOnboardingState(testStorage, progress);
    progress = readOnboardingState(testStorage);
    assert.equal(progress.finalNotesRead[note], true);
  }
  assert.ok(FINAL_NOTE_ORDER.every((note) => progress.finalNotesRead[note]));
});

test("older two-letter progress preserves both read letters", () => {
  saved.set(ONBOARDING_STORAGE_KEY, JSON.stringify({ ...moveOnboardingTo(createOnboardingState(), "reveal"), finalNotesRead: { reveal: true, adoption: true } }));
  const restored = readOnboardingState(testStorage);
  assert.deepEqual(restored.finalNotesRead, { reveal: true, crow: false, adoption: true });
});

test("onboarding contains the approved sequential function and reveal stages", () => {
  for (const step of ["skills", "profile", "achievements", "novel", "companion", "reveal", "adoption"]) {
    writeOnboardingState(testStorage, moveOnboardingTo(createOnboardingState(), step));
    assert.equal(readOnboardingState(testStorage).step, step);
  }
  const overlay = readFileSync(path.join(root, "src/onboarding/IntroductionOverlay.tsx"), "utf8");
  const app = readFileSync(path.join(root, "src/components/LifeRoomApp.tsx"), "utf8");
  assert.match(overlay, /Eight legs\. That was the number of legs\./);
  assert.match(overlay, /I am living in the future\./);
  assert.match(overlay, /I am in the past\./);
  assert.match(overlay, /The one in the middle will raise the little thing\./);
  assert.match(overlay, /When the light breaks, catch the fireflies\./);
  assert.match(overlay, /Would you like to raise it\?/);
  assert.match(overlay, /Meet the little crow/);
  assert.match(app, /companion: "guide"/);
  assert.doesNotMatch(overlay, /—A|—B/);
  assert.match(app, /Reset introduction/);
  assert.doesNotMatch(app, /Reset Life Room records/);
});

test("malformed onboarding storage returns a first-run state", () => {
  saved.set(ONBOARDING_STORAGE_KEY, "not-json");
  assert.equal(readOnboardingState(testStorage).step, "arrival");
  saved.set(ONBOARDING_STORAGE_KEY, JSON.stringify({ version: 99, status: "complete", step: "complete" }));
  assert.equal(readOnboardingState(testStorage).status, "not-started");
});

test("runtime onboarding assets remain present", () => {
  for (const asset of ["objects/envelope-3f.png", "objects/net-sweep-8f.png", "notes/leaf-note.png", "notes/note-paper-overlap.png", "pet/pet-flutter-8f.png", "pet/pet-footprint-8.png", "pet/pet-threatening-shadow.png"]) {
    assert.ok(existsSync(path.join(root, "basics/settings", asset)), `source ${asset} exists`);
    assert.ok(existsSync(path.join(root, "public/onboarding", asset)), `runtime ${asset} exists`);
  }
  assert.ok(existsSync(path.join(root, "public/onboarding/pet/pet-eight-legs-v5-8f.png")));
});

test("AI extension points are server routes with no browser-embedded key", () => {
  for (const route of ["src/app/api/guide/route.ts", "src/app/api/novel/route.ts", "src/app/api/insights/route.ts"]) {
    const source = readFileSync(path.join(root, route), "utf8");
    assert.match(source, /process\.env\.OPENAI_API_KEY|getOpenAIClient/);
  }
  const clients = ["src/furniture/panels/GuidePanel.tsx", "src/furniture/panels/NovelPanel.tsx", "src/furniture/panels/SkillPanel.tsx", "src/furniture/panels/AchievementPanel.tsx"].map((file) => readFileSync(path.join(root, file), "utf8")).join("\n");
  assert.doesNotMatch(clients, /sk-proj-|OPENAI_API_KEY/);
});

test("the app uses port 3001 and Vercel-compatible output", () => {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.name, "life-room");
  assert.match(pkg.scripts.dev, /--port 3001/);
  assert.match(pkg.scripts.start, /--port 3001/);
  assert.match(readFileSync(path.join(root, "next.config.ts"), "utf8"), /distDir: process\.env\.VERCEL \? "\.next" : "\.next-game"/);
});
