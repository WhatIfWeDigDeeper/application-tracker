import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div
        className="w-full max-w-md rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4"
        data-testid="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2 className="m-0 text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} type="button">
            {cancelLabel}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} type="button">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
