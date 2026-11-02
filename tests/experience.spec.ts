import { test, expect } from "@playwright/test";
test("page, cinematic navigation and packages", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "GO ALL IN",
  );
  const hero = await page.locator(".hero").boundingBox();
  const cta = await page
    .getByRole("link", { name: "Experience skydiving", exact: true })
    .boundingBox();
  expect(cta!.y + cta!.height).toBeLessThanOrEqual(hero!.y + hero!.height);
  await page
    .getByRole("link", { name: "Experience skydiving", exact: true })
    .click();
  await expect(page).toHaveURL(/#packages/);
  await expect(page.locator("#packages")).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "DELUXE", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".dive-overlay")).toBeHidden();
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
test("reduced motion navigates immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const hero = await page.locator(".hero").boundingBox();
  const cta = await page
    .getByRole("link", { name: "Experience skydiving", exact: true })
    .boundingBox();
  expect(cta!.y + cta!.height).toBeLessThanOrEqual(hero!.y + hero!.height);
  await page
    .getByRole("link", { name: "Experience skydiving", exact: true })
    .click();
  await expect(page).toHaveURL(/#packages/);
  await expect(page.locator(".dive-overlay")).toBeHidden();
  await expect(page.locator("#packages")).toBeFocused();
});
test("brochure, video, both, memory and unavailable model", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Open adventure concierge/ }).click();
  const input = page.getByRole("textbox", { name: "Message the concierge" });
  await expect(input).toBeFocused();
  await input.fill("Got a pamphlet?");
  await input.press("Enter");
  await expect(page.getByRole("link", { name: "Open PDF" })).toBeVisible();
  await input.fill("Can I see the jump footage?");
  await input.press("Enter");
  await expect(page.locator(".media-card video")).toHaveCount(1);
  await input.fill("Send both");
  await input.press("Enter");
  await expect(page.getByRole("link", { name: "Open PDF" })).toHaveCount(2);
  await expect(page.locator(".media-card video")).toHaveCount(2);
  await input.fill("How high is the jump?");
  await input.press("Enter");
  await expect(page.locator(".chat-viewport")).toContainText(
    "AI concierge is unavailable",
  );
  await input.press("Escape");
  await expect(page.locator("#concierge")).toBeHidden();
  await expect(
    page.getByRole("button", { name: /Open adventure concierge/ }),
  ).toBeFocused();
});
test("inspector uses backend and PDF is real", async ({ page, request }) => {
  await page.goto("/knowledge");
  await expect(
    page.getByText("5 meaningful passages", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Inspect question" }).click();
  await expect(
    page.getByText("BROCHURE_AND_VIDEO", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Exact retrieved model context" }),
  ).toBeVisible();
  const pdf = await request.get("/media/sea-view-demo-brochure.pdf");
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
});
test("film dialog and FAQ keyboard controls", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Watch the jump", exact: true })
    .click();
  await expect(page.locator(".film-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".film-dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Watch the jump", exact: true }),
  ).toBeFocused();
  const q = page.getByRole("button", {
    name: "Can I get a pickup from Bangkok?",
  });
  await q.scrollIntoViewIfNeeded();
  await q.focus();
  await page.keyboard.press("Enter");
  await expect(q).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByText("The official page lists Bangkok pickup", { exact: false }),
  ).toBeVisible();
});

test("transition rotation, gallery controls and unobstructed package actions", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".adventure-transition")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const seen: string[] = [];
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole("link", { name: "Experience skydiving", exact: true })
      .click();
    const overlay = page.locator(".adventure-transition");
    await expect(overlay).toBeVisible();
    seen.push((await overlay.getAttribute("data-theme"))!);
    await expect(overlay).toBeHidden();
    await expect(page.locator("#packages")).toBeFocused();
  }
  for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
  for (const label of ["eco", "deluxe", "vip"]) {
    const action = page.getByRole("link", {
      name: "Explore " + label,
      exact: true,
    });
    await action.scrollIntoViewIfNeeded();
    await expect(action).toBeVisible();
    const unobstructed = await action.evaluate((e) => {
      const r = e.getBoundingClientRect();
      return e.contains(
        document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
      );
    });
    expect(unobstructed).toBeTruthy();
  }
  const first = page.getByRole("button", { name: /Open photo:/ }).first();
  await first.click();
  const gallery = page.getByRole("dialog", { name: "Dropzone photo gallery" });
  await expect(gallery).toBeVisible();
  await page.getByRole("button", { name: "Next photo", exact: true }).click();
  await expect(gallery).toContainText("2 / 4");
  await page.keyboard.press("ArrowLeft");
  await expect(gallery).toContainText("1 / 4");
  await page.keyboard.press("Escape");
  await expect(gallery).not.toBeVisible();
  await expect(first).toBeFocused();
});

test("all sections render without waiting for scroll animation", async ({
  page,
}) => {
  await page.goto("/");
  for (const selector of [
    ".experience-copy",
    ".package",
    ".journey-intro",
    ".gallery-tile",
  ]) {
    expect(
      await page
        .locator(selector)
        .first()
        .evaluate((e) => ({
          opacity: getComputedStyle(e).opacity,
          visibility: getComputedStyle(e).visibility,
        })),
    ).toEqual({ opacity: "1", visibility: "visible" });
  }
});

test("immersive camera renders on WebGL and clears at the destination", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const overlay = page.locator(".adventure-transition");
  await expect(overlay).toHaveAttribute("data-engine", "ready", {
    timeout: 30000,
  });
  await page
    .getByRole("link", { name: "Experience skydiving", exact: true })
    .click();
  await expect(overlay).toHaveAttribute("data-renderer", "webgl");
  await expect(page.locator(".immersive-canvas")).toBeVisible();
  expect(
    await page
      .locator(".immersive-canvas")
      .evaluate(
        (e) => e instanceof HTMLCanvasElement && e.width > 0 && e.height > 0,
      ),
  ).toBeTruthy();
  await expect(overlay).toBeHidden();
  await expect(page.locator("#packages")).toBeFocused();
  expect(errors).toEqual([]);
});

test("navigation works when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl2" || type === "webgl") return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  const overlay = page.locator(".adventure-transition");
  await expect(overlay).toHaveAttribute("data-engine", "fallback", {
    timeout: 30000,
  });
  await page
    .getByRole("link", { name: "Experience skydiving", exact: true })
    .click();
  await expect(overlay).toHaveAttribute("data-renderer", "fallback");
  await expect(overlay).toBeHidden();
  await expect(page).toHaveURL(/#packages/);
});

test("watch film starts with sky transition, autoplay and a soft dialog entrance", async ({
  page,
}) => {
  await page.goto("/");
  const scene = page.locator(".adventure-transition");
  await expect(scene).toHaveAttribute("data-engine", "ready", {
    timeout: 30000,
  });
  await page
    .getByRole("button", { name: "Watch the jump", exact: true })
    .click();
  await expect(scene).toHaveAttribute("data-theme", "sky");
  await expect(scene).toBeVisible();
  const film = page.getByRole("dialog", {
    name: "Official Sea View skydiving film",
  });
  await expect(film).toBeVisible();
  await expect(scene).toBeHidden();
  expect(new URL(page.url()).hash).toBe("");
  const video = film.locator("video");
  await expect(video).toHaveJSProperty("muted", true);
  await expect
    .poll(() => video.evaluate((e) => (e as HTMLVideoElement).currentTime), {
      timeout: 20000,
    })
    .toBeGreaterThan(0);
  expect(await film.evaluate((e) => getComputedStyle(e).animationName)).toBe(
    "film-arrive",
  );
  await page.keyboard.press("Escape");
  await expect(film).not.toBeVisible();
  const galleryTrigger = page.getByRole("button", {
    name: "See the jump in motion",
    exact: true,
  });
  await galleryTrigger.click();
  await expect(scene).toHaveAttribute("data-theme", "sky");
  await expect(film).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(scene).toBeHidden();
  await expect(galleryTrigger).toBeFocused();
});
