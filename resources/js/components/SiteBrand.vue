<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { computed } from 'vue';
import { useProject } from '@/composables/useProject';
import { splitWordmark } from '@game/presentation';

const props = defineProps<{ footer?: boolean }>();
const project = useProject();
const logo = computed(() => props.footer ? project.value.footerLogo : project.value.headerLogo);
const wordmark = computed(() => splitWordmark(project.value.brand));
</script>

<template>
    <Link href="/" class="site-logo" :aria-label="project.brand">
        <img v-if="logo" class="site-brand-image" :src="logo" alt="" />
        <template v-else>
            <span class="brand-rune" aria-hidden="true">✦</span>
            <span class="brand-wordmark"><span v-if="wordmark[0]">{{ wordmark[0] }}</span><strong>{{ wordmark[1] }}</strong></span>
        </template>
    </Link>
</template>
