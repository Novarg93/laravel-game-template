import generated from './presentation.generated.json';

export interface GamePresentation {
    title: string;
    subtitle: string;
    description: string;
    tagline: string;
    logo: string | null;
    favicon: string | null;
    theme: string;
    accent: string | null;
}

export const standalonePresentation: GamePresentation = generated;

export function gamePresentation(element: HTMLElement): GamePresentation {
    const data = element.dataset.projectGame;
    return data ? JSON.parse(data) as GamePresentation : standalonePresentation;
}

export function splitWordmark(name: string): [string, string] {
    const boundary = name.lastIndexOf(' ');
    if (boundary === -1) return ['', name.toUpperCase()];
    return [name.slice(0, boundary).toUpperCase(), name.slice(boundary + 1).toUpperCase()];
}
