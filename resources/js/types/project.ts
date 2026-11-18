import type { GamePresentation } from '@game/presentation';

interface HeroCopy {
    title: string[];
    description: string;
    traits: string[];
}

export interface ProjectPresentation {
    id: string;
    name: string;
    brand: string;
    tagline: string;
    description: string;
    headerLogo: string | null;
    footerLogo: string | null;
    favicon: string | null;
    legacyFavicon: string | null;
    touchIcon: string | null;
    socialImage: string | null;
    supportEmail: string | null;
    legalOperator: string | null;
    theme: string;
    game: GamePresentation;
    homepage: {
        title: string;
        pageTitle: string;
        overline: string;
        tagline: string[];
        description: string;
        playLabel: string;
        heroesLabel: string;
        registerLabel: string;
        platformNote: string;
        stats: { value: string; label: string }[];
        capture: { image: string; alt: string; location: string; label: string; caption: string; captionDetail: string };
        features: string[];
        heroes: { overline: string; title: string; description: string[]; mage: HeroCopy; warrior: HeroCopy };
        expedition: { overline: string; title: string[]; emphasis: string; description: string; linkLabel: string; image: string; alt: string; caption: string };
        progression: { overline: string; title: string; cards: { label: string; title: string; description: string }[]; note: string };
        footerNote: string;
    };
}
