<script lang="ts">
  interface Props {
    value: number | null;
    onchange: (value: number | null) => void;
    allowClear?: boolean;
  }

  let { value, onchange, allowClear = true }: Props = $props();

  let hoverValue = $state<number | null>(null);
  const displayValue = $derived(hoverValue ?? value ?? 0);
  const stars = $derived(Array.from({ length: 5 }, (_, i) => i + 1));

  function handleClick(star: number) {
    if (allowClear && value === star) {
      onchange(null);
    } else {
      onchange(star);
    }
  }

  function handleKeyDown(event: KeyboardEvent, star: number) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleClick(star);
    }
  }
</script>

<div class="flex items-center gap-1" role="radiogroup" aria-label="Rating">
  {#each stars as star}
    <button
      type="button"
      role="radio"
      class="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
      tabindex={value === star ? 0 : -1}
      onclick={() => handleClick(star)}
      onkeydown={(e) => handleKeyDown(e, star)}
      onmouseenter={() => (hoverValue = star)}
      onmouseleave={() => (hoverValue = null)}
      aria-label="{star} stars"
      aria-checked={value === star ? 'true' : 'false'}
    >
      <svg
        class="h-6 w-6 transition-colors {star <= displayValue
          ? 'text-yellow-400'
          : 'text-gray-300 dark:text-gray-600 hover:text-yellow-200'}"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    </button>
  {/each}
</div>
