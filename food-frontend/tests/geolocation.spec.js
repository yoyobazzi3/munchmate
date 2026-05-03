import { test, expect } from "@playwright/test";

const HOME = "/";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Clear the localStorage coord cache so the hook is forced to call getCurrentPosition */
async function clearCoordCache(page) {
  await page.evaluate(() => localStorage.removeItem("munchmate_last_coords"));
}

/** Inject a fresh coord cache so the hook skips the live GPS call */
async function seedCoordCache(page, lat = 37.7749, lon = -122.4194) {
  await page.evaluate(
    ({ lat, lon }) =>
      localStorage.setItem(
        "munchmate_last_coords",
        JSON.stringify({ latitude: lat, longitude: lon, ts: Date.now() })
      ),
    { lat, lon }
  );
}

/** Inject an EXPIRED coord cache (older than 30 min) */
async function seedExpiredCache(page) {
  const expired = Date.now() - 31 * 60 * 1000;
  await page.evaluate(
    (ts) =>
      localStorage.setItem(
        "munchmate_last_coords",
        JSON.stringify({ latitude: 37.7749, longitude: -122.4194, ts })
      ),
    expired
  );
}

// ─── tests ──────────────────────────────────────────────────────────────────

test.describe("Geolocation permission prompt", () => {
  // ── 1. Fresh user, permission GRANTED ────────────────────────────────────
  test("triggers browser geolocation and uses coordinates when permission is granted", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      permissions: ["geolocation"],
      geolocation: { latitude: 37.7749, longitude: -122.4194 },
    });
    const page = await context.newPage();

    // Track whether getCurrentPosition was ever called
    let geolocationCalled = false;
    await page.addInitScript(() => {
      const original = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = function (...args) {
        window.__geolocationCalled = true;
        return original(...args);
      };
    });

    await page.goto(HOME);
    await clearCoordCache(page);
    // Reload so the hook runs with no cache
    await page.reload();
    await page.waitForTimeout(2000);

    geolocationCalled = await page.evaluate(() => !!window.__geolocationCalled);
    expect(geolocationCalled, "getCurrentPosition should have been called on page load").toBe(true);

    await context.close();
  });

  // ── 2. Fresh user, permission DENIED ─────────────────────────────────────
  test("shows a visible error / prompt-UI when permission is denied and there is no cache", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      // Deliberately do NOT grant geolocation — the API returns PERMISSION_DENIED
      permissions: [],
    });
    const page = await context.newPage();
    await page.goto(HOME);
    await clearCoordCache(page);
    await page.reload();

    // Wait for any async geolocation attempt to settle
    await page.waitForTimeout(3000);

    // The app should surface at least one of its location-prompt UI elements:
    //  • "Share My Location" button (PopularSection)
    //  • "Enable Location" button (RecommendedSection)
    //  • "We need your location" text
    const locationPromptVisible = await page
      .getByText(/share my location|enable location|we need your location/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(
      locationPromptVisible,
      "App should show a location-prompt UI element when permission is denied"
    ).toBe(true);

    await context.close();
  });

  // ── 3. Cached coords — hook must still call getCurrentPosition (silent refresh) ──
  test("silently refreshes geolocation in the background even when cached coords exist", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      permissions: ["geolocation"],
      geolocation: { latitude: 37.7749, longitude: -122.4194 },
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = function (...args) {
        window.__geolocationCalled = true;
        // Still call success so the hook resolves properly
        args[0]({ coords: { latitude: 37.7749, longitude: -122.4194 } });
      };
    });

    await page.goto(HOME);
    await seedCoordCache(page);
    await page.reload();
    await page.waitForTimeout(2000);

    const called = await page.evaluate(() => !!window.__geolocationCalled);
    expect(called, "getCurrentPosition should still be called for a silent background refresh").toBe(
      true
    );

    await context.close();
  });

  // ── 4. EXPIRED cache — must prompt / fetch fresh coords ──────────────────
  test("fetches fresh location when the localStorage cache has expired (> 30 min old)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      permissions: ["geolocation"],
      geolocation: { latitude: 37.7749, longitude: -122.4194 },
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = function (...args) {
        window.__geolocationCalled = true;
        args[0]({ coords: { latitude: 37.7749, longitude: -122.4194 } });
      };
    });

    await page.goto(HOME);
    await seedExpiredCache(page);
    await page.reload();
    await page.waitForTimeout(2000);

    const called = await page.evaluate(() => !!window.__geolocationCalled);
    expect(called, "getCurrentPosition should be called when the cache is expired").toBe(true);

    await context.close();
  });

  // ── 5. CRITICAL: denied + cached coords — error must NOT be silently swallowed ──
  test("surfaces a location error when permission is denied even if stale cached coords exist", async ({
    browser,
  }) => {
    // Scenario: user granted permission once (so we have cached coords),
    // then revoked it. The silent background refresh rejects but the error
    // is swallowed by `if (!silent) setLocationError(...)`.
    // This means the user sees stale restaurants and no indication to re-enable.
    const context = await browser.newContext({
      permissions: [], // denied
    });
    const page = await context.newPage();
    await page.goto(HOME);
    // Seed fresh-ish cache (15 min old — within TTL)
    const fifteenMinAgo = Date.now() - 15 * 60 * 1000;
    await page.evaluate(
      (ts) =>
        localStorage.setItem(
          "munchmate_last_coords",
          JSON.stringify({ latitude: 37.7749, longitude: -122.4194, ts })
        ),
      fifteenMinAgo
    );
    await page.reload();
    await page.waitForTimeout(3000);

    // The app SHOULD show some indication that location is unavailable/denied.
    // If this test FAILS it confirms the bug: the error is silently swallowed.
    const errorVisible = await page
      .getByText(/share my location|enable location|we need your location|location permission denied/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(
      errorVisible,
      "BUG: location error is silently swallowed when silent=true and permission is denied — user gets stale data with no prompt"
    ).toBe(true);
  });

  // ── 6. Geolocation API missing (old browser / restricted env) ────────────
  test("shows a graceful UI when the Geolocation API is unavailable", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Remove the geolocation API to simulate an unsupported browser
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "geolocation", { value: undefined });
    });

    await page.goto(HOME);
    await clearCoordCache(page);
    await page.reload();
    await page.waitForTimeout(2000);

    // App shouldn't crash — it should render and show something useful
    const body = await page.locator("body").isVisible();
    expect(body, "Page should still render when geolocation is unavailable").toBe(true);

    await context.close();
  });
});
