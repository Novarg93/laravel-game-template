import { createInertiaApp } from '@inertiajs/vue3';
import { initializeTheme } from '@/composables/useAppearance';
import AppLayout from '@/layouts/SiteLayout.vue';
import AccountLayout from '@/layouts/AccountLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';
import SettingsLayout from '@/layouts/settings/Layout.vue';
import { initializeFlashToast } from '@/lib/flashToast';
import type { ProjectPresentation } from '@/types/project';

void createInertiaApp({
    // Inertia 3 passes the current page to the title callback, including during SSR.
    title: (title, page) => {
        const project = page?.props.project as ProjectPresentation | undefined;
        const name = project?.name ?? import.meta.env.VITE_APP_NAME ?? 'Laravel';
        const escaped = name.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
        return title ? `${title} - ${escaped}` : escaped;
    },
    layout: (name) => {
        switch (true) {
            case ['Welcome', 'Faq', 'Contact', 'Legal'].includes(name):
                return AppLayout;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, AccountLayout, SettingsLayout];
            case name.startsWith('account/') || ['Dashboard', 'Wallet', 'Inventory', 'RunHistory', 'RunHistoryDetail'].includes(name):
                return [AppLayout, AccountLayout];
            default:
                return AppLayout;
        }
    },
    withApp: (app) => {
        app.directive('focus', {
            mounted: (el: HTMLElement, shouldFocus) => {
                if (shouldFocus.value !== false) {
                    el.focus();
                }
            },
        });
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on page load...
initializeTheme();

// This will listen for flash toast data from the server...
initializeFlashToast();
