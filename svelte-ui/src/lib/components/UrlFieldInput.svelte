<script lang="ts">
  interface Props {
    value: string;
    onchange: (value: string) => void;
    label?: string;
    placeholder?: string;
    error?: string;
  }

  let { value, onchange, label, placeholder, error }: Props = $props();

  // Local mutable copy for bind:value (ensures Playwright fill() works)
  let localValue = $state(value);

  // Sync from parent prop to local state
  $effect(() => {
    localValue = value;
  });

  const isValidUrl = $derived(localValue.startsWith('http://') || localValue.startsWith('https://'));

  function handleInput() {
    onchange(localValue);
  }

  function openUrl() {
    if (isValidUrl) {
      window.open(localValue, '_blank');
    }
  }
</script>

<div>
  {#if label}
    <label class="label mb-1">{label}</label>
  {/if}
  <div class="flex items-center gap-2">
    <input
      type="url"
      class="input flex-1 {error ? 'border-red-500' : ''}"
      bind:value={localValue}
      {placeholder}
      oninput={handleInput}
    />
    {#if isValidUrl}
      <button
        type="button"
        class="p-2 rounded-md text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        title="Open URL in new tab"
        onclick={openUrl}
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </button>
    {/if}
  </div>
  {#if error}
    <p class="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
  {/if}
</div>
