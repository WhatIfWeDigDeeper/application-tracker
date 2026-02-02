<script lang="ts">
  import type { ApplicationStatus } from '$lib/types';
  import { STATUS_LABELS, STATUS_COLORS } from '$lib/types';

  interface Props {
    status: ApplicationStatus;
    size?: 'small' | 'medium';
  }

  let { status, size = 'medium' }: Props = $props();

  const sizeClasses = $derived(size === 'small' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm');
</script>

<span class="inline-flex items-center rounded-full font-medium {STATUS_COLORS[status]} {sizeClasses}">
  {STATUS_LABELS[status]}
</span>
