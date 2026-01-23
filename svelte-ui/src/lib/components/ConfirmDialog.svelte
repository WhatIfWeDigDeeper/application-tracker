<script lang="ts">
  interface Props {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: 'primary' | 'danger';
    onconfirm: () => void;
    oncancel: () => void;
  }

  let {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmVariant = 'primary',
    onconfirm,
    oncancel,
  }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      oncancel();
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('dialog-backdrop')) {
      oncancel();
    }
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center dialog-backdrop bg-black/50"
  onkeydown={handleKeydown}
  onclick={handleBackdropClick}
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
    <p class="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
    <div class="flex justify-end gap-3">
      <button type="button" class="btn-secondary" onclick={oncancel}>
        {cancelLabel}
      </button>
      <button type="button" class={confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'} onclick={onconfirm}>
        {confirmLabel}
      </button>
    </div>
  </div>
</div>
