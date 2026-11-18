import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import type { ProjectPresentation } from '../../resources/js/types/project';

const preview = process.env.TEMPLATE_BRANDING_PREVIEW === '1';

function projectProps(payload: string): ProjectPresentation {
    return (JSON.parse(payload) as { props: { project: ProjectPresentation } }).props.project;
}

function screenshotFolder(theme: string) {
    const folder = `screenshots/project-branding/${theme}`;
    mkdirSync(folder, { recursive: true });
    return folder;
}

function html(value: string) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

async function assertLogo(page: Page, selector: string, project: ProjectPresentation, asset: string | null) {
    const mark = page.locator(selector).getByRole('link', { name: project.brand, exact: true });
    await expect(mark).toBeVisible();
    if (asset) {
        const image = mark.locator('img');
        await expect(image).toHaveAttribute('src', asset);
        await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    }
}

async function assertNoOverflow(page: Page) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('configured branding, SSR metadata, theme and guest game', async ({ page, request }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    const response = await request.get('/');
    expect(response.ok()).toBe(true);
    const markup = await response.text();
    const payload = markup.match(/<script data-page="app" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
    expect(payload).toBeTruthy();
    const project = projectProps(payload!);
    const { name, game, theme, homepage } = project;
    const folder = screenshotFolder(theme);
    if (preview) {
        expect([name, game.title, theme, game.theme]).toEqual(['Aurora Trial', 'Aurora Grove', 'aurora', 'aurora']);
    }
    expect(markup).toContain('<h1>');
    expect(markup).toContain(`<meta property="og:site_name" content="${html(name)}">`);
    expect(markup.match(/<title[^>]*>([^<]+)<\/title>/)?.[1]).toBe(html(`${homepage.pageTitle} - ${name}`));

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(homepage.title.split(' ').at(-1)!.toUpperCase());
    await assertLogo(page, 'header', project, project.headerLogo);
    await assertLogo(page, 'footer', project, project.footerLogo);
    await expect(page.locator('footer')).toContainText(project.tagline);
    const button = page.locator('.hero-copy .site-button');
    await expect(button).toContainText(homepage.playLabel);
    await expect(button).toHaveAttribute('href', '/play');
    if (preview) {
        expect(markup).toContain('/project-theme/aurora.css');
        await expect(button).toHaveCSS('background-color', 'rgb(147, 185, 255)');
    }
    if (project.favicon) {
        await expect(page.locator(`head link[rel=icon][href="${project.favicon}"]`)).toHaveCount(1);
    }
    await assertNoOverflow(page);
    await page.screenshot({ path: `${folder}/home-desktop.png`, fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoOverflow(page);
    await expect(page.locator('footer .site-logo')).toBeVisible();
    await page.screenshot({ path: `${folder}/home-mobile.png`, fullPage: true });
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.getByRole('link', { name: 'Guide', exact: true }).click();
    await expect(page).toHaveTitle(`Guide - ${name}`);
    await page.screenshot({ path: `${folder}/guide.png`, fullPage: true });
    await page.goto('/play');
    await expect(page).toHaveTitle(`${game.title} — Play`);
    await expect(page.getByRole('heading', { name: game.title, exact: true })).toBeVisible();
    await expect(page.locator('.menu-shell')).toHaveAttribute('data-menu-theme', game.theme);
    if (game.logo) {
        await expect(page.locator('.menu-brand-image')).toHaveAttribute('src', game.logo);
    } else if (preview && !game.accent) {
        await expect(page.locator('.menu-wordmark-accent')).toHaveCSS('color', 'rgb(147, 185, 255)');
    }
    await page.screenshot({ path: `${folder}/play-menu.png` });
    await page.getByRole('button', { name: /^Start run/ }).click();
    await expect(page.locator('.hud')).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(1);
    await page.screenshot({ path: `${folder}/play-hud.png` });
    expect(errors).toEqual([]);
});

test('auth, account, shop and Filament follow the configured project', async ({ page, browser }) => {
    await page.goto('/login');
    const project = projectProps((await page.locator('script[data-page="app"]').textContent())!);
    const { name } = project;
    const folder = screenshotFolder(project.theme);
    expect((await page.title()).endsWith(name)).toBe(true);
    await assertLogo(page, 'header', project, project.headerLogo);
    await page.screenshot({ path: `${folder}/login.png`, fullPage: true });
    await page.locator('#email').fill('admin@admin.admin');
    await page.locator('#password').fill('Template-test-only-2026!');
    await page.locator('button[type=submit]').last().click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).toHaveTitle(`Account - ${name}`);
    await assertLogo(page, 'header', project, project.headerLogo);
    await assertNoOverflow(page);
    await page.screenshot({ path: `${folder}/account.png`, fullPage: true });
    await page.goto('/shop');
    await expect(page).toHaveTitle(`Shop - ${name}`);
    await page.screenshot({ path: `${folder}/shop.png`, fullPage: true });
    await page.goto('/admin');
    await expect(page.locator('.fi-topbar .fi-logo')).toBeVisible();
    if (preview) {
        await expect(page.locator('.fi-body')).toHaveCSS('background-color', 'rgb(21, 23, 43)');
    }
    await assertNoOverflow(page);
    await page.screenshot({ path: `${folder}/filament.png`, fullPage: true });
    const guest = await browser.newPage();
    try {
        await guest.goto(new URL('/admin', page.url()).href);
        await expect(guest).toHaveURL(/\/login$/);
    } finally {
        await guest.close();
    }
});
