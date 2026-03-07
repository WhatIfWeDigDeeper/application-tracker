import { CanDeactivateFn } from '@angular/router';
import { Signal } from '@angular/core';

export interface HasUnsavedChanges {
  isDirty: Signal<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component
) => {
  if (component.isDirty()) {
    return window.confirm('You have unsaved changes. Leave anyway?');
  }
  return true;
};
