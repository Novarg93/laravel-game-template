import { createApp } from 'vue';
import App from './App.vue';
import { gamePresentation } from './presentation';
import './style.css';
import './ui/hd-theme.css';
import './ui/mobile-layout.css';
const root = document.getElementById('app');
if (root) createApp(App, { presentation: gamePresentation(root) }).mount(root);
