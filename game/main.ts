import { createApp } from 'vue';
import App from './App.vue';
import { gameDefinition } from './content/registry';
import { gamePresentation } from './presentation';
import './style.css';
import './ui/hd-theme.css';
import './ui/mobile-layout.css';
const root = document.getElementById('app');
if (root) {
    const preview = import.meta.env.DEV && new URLSearchParams(location.search).get('content') === 'training-grove';
    const selected = gameDefinition(root.dataset.contentPreset ?? (preview ? 'training-grove' : import.meta.env.VITE_GAME_CONTENT_PRESET));
    const content = !root.dataset.contentPreset && selected.experimental && !import.meta.env.DEV ? gameDefinition() : selected;
    if (root.dataset.contentVersion && root.dataset.contentVersion !== content.version) {
        root.textContent = 'Game content was updated. Reload the page to play.';
    } else {
        createApp(App, { presentation: gamePresentation(root), content }).mount(root);
    }
}
