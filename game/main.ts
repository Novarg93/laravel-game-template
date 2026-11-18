import { createApp } from 'vue';
import App from './App.vue';
import { selectAssetPack } from './art/packs/registry';
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
        try {
            const query = new URLSearchParams(location.search);
            const allowDevelopment = root.dataset.contentPreset ? root.dataset.assetPackPreview === '1' : import.meta.env.DEV;
            const requested = allowDevelopment ? query.get('pack') : null;
            const configured = root.dataset.assetPack || import.meta.env.VITE_GAME_ASSET_PACK;
            const assetPack = selectAssetPack(content, requested ?? configured, allowDevelopment);
            root.dataset.activeAssetPack = assetPack.id;
            createApp(App, { presentation: gamePresentation(root), content, assetPack }).mount(root);
        } catch (error) {
            root.setAttribute('role', 'alert');
            root.textContent = error instanceof Error ? error.message : 'Game assets are unavailable.';
        }
    }
}
