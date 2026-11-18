import { usePage } from '@inertiajs/vue3';
import { computed } from 'vue';

export function useProject() {
    const page = usePage();
    return computed(() => page.props.project);
}
