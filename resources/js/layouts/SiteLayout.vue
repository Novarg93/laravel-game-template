<script setup lang="ts">
import { Link, usePage } from '@inertiajs/vue3';
import CurrencySwitcher from '@/components/CurrencySwitcher.vue';
import UserMenu from '@/components/UserMenu.vue';
import SiteBrand from '@/components/SiteBrand.vue';
import { useProject } from '@/composables/useProject';
const page = usePage();
const project = useProject();
const links = [
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/guide', label: 'Guide' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
];
function current(href: string) { return page.url.split('?')[0] === href || page.url.startsWith(`${href}/`); }
</script>
<template>
    <div class="site-shell">
        <header class="site-header">
            <div class="site-header-inner">
                <SiteBrand />
                <nav class="site-primary-nav" aria-label="Main navigation">
                    <Link v-for="link in links" :key="link.href" :href="link.href" :aria-current="current(link.href) ? 'page' : undefined">{{ link.label }}</Link>
                    <template v-if="page.props.auth.authenticated ?? !!page.props.auth.user"><Link href="/shop" :aria-current="current('/shop') ? 'page' : undefined">Shop</Link><Link href="/wallet" :aria-current="current('/wallet') ? 'page' : undefined">Wallet</Link></template>
                    <Link v-if="page.props.auth.can_operate" href="/operations" :aria-current="current('/operations') ? 'page' : undefined">Operations</Link>
                </nav>
                <div class="site-account-actions"><CurrencySwitcher /><UserMenu /></div>
                <a href="/play" class="site-button compact header-play">{{ project.homepage.playLabel }} <span aria-hidden="true">↗</span></a>
            </div>
        </header>
        <main class="site-content"><slot /></main>
        <footer class="site-footer">
            <div><SiteBrand footer /><p>{{ project.tagline }}</p></div>
            <nav aria-label="Footer links"><Link href="/privacy">Privacy Policy · draft</Link><Link href="/terms">Terms of Service · draft</Link><Link href="/contact">Feedback</Link></nav>
            <small>{{ project.homepage.footerNote }}</small>
        </footer>
    </div>
</template>
