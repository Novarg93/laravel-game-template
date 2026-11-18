/** Same-origin, session-authenticated browser endpoints. Never accepts an external URL. */
export function internalRoute(path: string): string {
    if (!/^\/(?!\/)/.test(path) || /[\\?#]/.test(path) || path.split('/').some(part => part === '.' || part === '..') || /%/i.test(path)) {
        throw new Error('Expected an internal application path.');
    }
    return `/internal${path}`;
}
