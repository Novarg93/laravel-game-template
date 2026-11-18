<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { computed } from 'vue';
import { useProject } from '@/composables/useProject';
import { splitWordmark } from '@game/presentation';
import { gameDefinition, publicHeroes } from '@game/content/registry';

defineOptions({ name: 'WelcomePage' });
const project = useProject();
const home = computed(() => project.value.homepage);
const wordmark = computed(() => splitWordmark(home.value.title));
const page = usePage<{ gameContentPreset: string }>();
const content = computed(() => gameDefinition(page.props.gameContentPreset));
const heroes = computed(() => publicHeroes(content.value).map(hero => ({
    ...hero,
    marketing: hero.id === 'mage' || hero.id === 'warrior' ? home.value.heroes[hero.id] : {
        title: [hero.name], description: hero.description, traits: [hero.hp + ' HP'],
    },
})));
</script>
<template>
    <Head :title="home.pageTitle" />
    <section class="landing-hero">
        <div class="hero-copy">
            <p class="overline"><span class="status-spark" aria-hidden="true"></span> {{ home.overline }}</p>
            <h1><template v-if="wordmark[0]">{{ wordmark[0] }}<br /></template><span>{{ wordmark[1] }}</span></h1>
            <p class="hero-tagline"><template v-for="(line, index) in home.tagline" :key="index"><br v-if="index" />{{ line }}</template></p>
            <p>{{ home.description }}</p>
            <div class="cta-row"><a href="/play" class="site-button">{{ home.playLabel }} <span aria-hidden="true">↗</span></a><a href="#heroes" class="quiet-link">{{ home.heroesLabel }} ↓</a></div>
            <small>{{ home.platformNote }}</small>
            <div class="hero-run-stats"><div v-for="(stat, index) in home.stats" :key="index"><strong>{{ stat.value }}</strong><span>{{ stat.label }}</span></div></div>
        </div>
        <figure class="hero-arena">
            <div class="arena-topline"><span><i aria-hidden="true"></i> {{ home.capture.location }}</span><span>{{ home.capture.label }}</span></div>
            <img class="hero-scene" :src="home.capture.image" :alt="home.capture.alt" fetchpriority="high" />
            <figcaption><span>{{ home.capture.caption }}</span><span>{{ home.capture.captionDetail }}</span></figcaption>
        </figure>
    </section>
    <div class="feature-strip"><span v-for="(feature, index) in home.features" :key="index">{{ feature }}</span></div>
    <section id="heroes" class="site-section">
        <div class="section-heading">
            <div><p class="overline">{{ home.heroes.overline }}</p><h2>{{ home.heroes.title }}</h2></div>
            <p><template v-for="(line, index) in home.heroes.description" :key="index"><br v-if="index" />{{ line }}</template></p>
        </div>
        <div class="hero-grid">
            <article v-for="(hero, index) in heroes" :key="hero.id" class="hero-card" :class="hero.visual">
                <div class="hero-card-top"><div class="hero-number">{{ String(index + 1).padStart(2, '0') }} / {{ hero.name.toUpperCase() }}</div><span class="hero-sigil" aria-hidden="true">{{ hero.visual === 'mage' ? '✧' : '⚔' }}</span></div>
                <h3><template v-for="(line, lineIndex) in hero.marketing.title" :key="lineIndex"><br v-if="lineIndex" />{{ line }}</template></h3>
                <p>{{ hero.marketing.description }}</p>
                <div class="hero-traits"><span v-for="(trait, traitIndex) in hero.marketing.traits" :key="traitIndex">{{ trait }}</span></div>
                <a href="/play">Play as {{ hero.name }} <span aria-hidden="true">↗</span></a>
            </article>
        </div>
    </section>
    <section class="site-section expedition">
        <div>
            <p class="overline">{{ home.expedition.overline }}</p>
            <h2><template v-for="(line, index) in home.expedition.title" :key="index">{{ line }}<br /></template><em>{{ home.expedition.emphasis }}</em></h2>
            <p>{{ home.expedition.description }}</p>
            <Link href="/faq" class="quiet-link">{{ home.expedition.linkLabel }} →</Link>
        </div>
        <figure><img :src="home.expedition.image" :alt="home.expedition.alt" loading="lazy" /><figcaption>{{ home.expedition.caption }}</figcaption></figure>
    </section>
    <section class="site-section progression-preview">
        <p class="overline">{{ home.progression.overline }}</p><h2>{{ home.progression.title }}</h2>
        <div class="progression-grid"><div v-for="(card, index) in home.progression.cards" :key="index"><b>{{ card.label }}</b><h3>{{ card.title }}</h3><p>{{ card.description }}</p></div></div>
        <Link href="/register" class="site-button">{{ home.registerLabel }} <span aria-hidden="true">→</span></Link>
        <p class="subtle">{{ home.progression.note }}</p>
    </section>
</template>
