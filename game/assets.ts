/** Public game files are independent of Vite's /build/ base and of the entry point. */
export function gameAssetUrl(path: string): string {
    return `/game-assets/${path.replace(/^(?:assets|game-assets)\//, '')}`;
}
