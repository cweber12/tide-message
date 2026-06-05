from playwright.sync_api import sync_playwright

errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 1400})
    page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

    page.goto("http://localhost:8731/index.html")
    page.wait_for_load_state("networkidle")
    # give charts a moment to mount after fetches resolve
    page.wait_for_timeout(2500)
    page.screenshot(path="/tmp/overview.png", full_page=True)

    page.goto("http://localhost:8731/index.html#/activity/surf")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    page.screenshot(path="/tmp/surf.png", full_page=True)

    # quick DOM sanity checks
    chips = page.locator(".rating-chip").count()
    stats = page.locator(".context-stat").count()
    featured = page.locator(".report-card.is-featured").count()
    grid_cards = page.locator(".report-grid .report-card").count()
    print(f"surf view -> chips={chips} stats={stats} featured={featured} grid_cards={grid_cards}")

    browser.close()

print("CONSOLE ISSUES:" if errors else "No console errors/warnings")
for e in errors:
    print(" ", e)
