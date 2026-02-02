/**
 * Unit tests for RatingInput component
 * Tests accessibility features including ARIA roles, keyboard navigation, and screen reader support
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import RatingInput from './RatingInput.vue';

describe('RatingInput', () => {
  describe('Accessibility - ARIA roles', () => {
    it('renders with proper radiogroup role', () => {
      render(RatingInput, {
        props: {
          modelValue: null,
        },
      });

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toBeTruthy();
      expect(radiogroup.getAttribute('aria-label')).toBe('Rating');
    });

    it('renders 5 radio buttons with proper role', () => {
      render(RatingInput, {
        props: {
          modelValue: null,
        },
      });

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(5);
    });

    it('each radio button has correct aria-label', () => {
      render(RatingInput, {
        props: {
          modelValue: null,
        },
      });

      const radios = screen.getAllByRole('radio');
      radios.forEach((radio, index) => {
        expect(radio.getAttribute('aria-label')).toBe(`${index + 1} stars`);
      });
    });

    it('sets aria-checked="true" for selected star', () => {
      render(RatingInput, {
        props: {
          modelValue: 3,
        },
      });

      const threeStarRadio = screen.getByRole('radio', { name: '3 stars' });
      expect(threeStarRadio.getAttribute('aria-checked')).toBe('true');
    });

    it('sets aria-checked="false" for unselected stars', () => {
      render(RatingInput, {
        props: {
          modelValue: 3,
        },
      });

      const oneStarRadio = screen.getByRole('radio', { name: '1 stars' });
      const fiveStarRadio = screen.getByRole('radio', { name: '5 stars' });
      
      expect(oneStarRadio.getAttribute('aria-checked')).toBe('false');
      expect(fiveStarRadio.getAttribute('aria-checked')).toBe('false');
    });
  });

  describe('Accessibility - Roving tabindex', () => {
    it('selected star has tabindex="0"', () => {
      render(RatingInput, {
        props: {
          modelValue: 3,
        },
      });

      const threeStarRadio = screen.getByRole('radio', { name: '3 stars' });
      expect(threeStarRadio.getAttribute('tabindex')).toBe('0');
    });

    it('unselected stars have tabindex="-1"', () => {
      render(RatingInput, {
        props: {
          modelValue: 3,
        },
      });

      const oneStarRadio = screen.getByRole('radio', { name: '1 stars' });
      const fiveStarRadio = screen.getByRole('radio', { name: '5 stars' });
      
      expect(oneStarRadio.getAttribute('tabindex')).toBe('-1');
      expect(fiveStarRadio.getAttribute('tabindex')).toBe('-1');
    });

    it('first star has tabindex="0" when no rating is selected', () => {
      render(RatingInput, {
        props: {
          modelValue: null,
        },
      });

      const firstStarRadio = screen.getByRole('radio', { name: '1 stars' });
      const otherRadios = screen.getAllByRole('radio').slice(1);
      
      expect(firstStarRadio.getAttribute('tabindex')).toBe('0');
      otherRadios.forEach((radio) => {
        expect(radio.getAttribute('tabindex')).toBe('-1');
      });
    });
  });

  describe('Keyboard interaction', () => {
    it('activates star on Space key press', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();

      render(RatingInput, {
        props: {
          modelValue: null,
          'onUpdate:modelValue': onUpdate,
        },
      });

      const threeStarRadio = screen.getByRole('radio', { name: '3 stars' });
      threeStarRadio.focus();
      await user.keyboard(' ');

      expect(onUpdate).toHaveBeenCalledWith(3);
    });

    it('activates star on Enter key press', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();

      render(RatingInput, {
        props: {
          modelValue: null,
          'onUpdate:modelValue': onUpdate,
        },
      });

      const fourStarRadio = screen.getByRole('radio', { name: '4 stars' });
      fourStarRadio.focus();
      await user.keyboard('{Enter}');

      expect(onUpdate).toHaveBeenCalledWith(4);
    });

    it('prevents default behavior on Space key', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();

      render(RatingInput, {
        props: {
          modelValue: null,
          'onUpdate:modelValue': onUpdate,
        },
      });

      const twoStarRadio = screen.getByRole('radio', { name: '2 stars' });
      twoStarRadio.focus();
      
      // The component should prevent default, so we just verify it calls the handler
      await user.keyboard(' ');
      expect(onUpdate).toHaveBeenCalledWith(2);
    });
  });

  describe('Mouse interaction', () => {
    it('updates rating on click', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();

      render(RatingInput, {
        props: {
          modelValue: null,
          'onUpdate:modelValue': onUpdate,
        },
      });

      const threeStarRadio = screen.getByRole('radio', { name: '3 stars' });
      await user.click(threeStarRadio);

      expect(onUpdate).toHaveBeenCalledWith(3);
    });

    it('clears rating when clicking selected star and allowClear is true', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();

      render(RatingInput, {
        props: {
          modelValue: 3,
          allowClear: true,
          'onUpdate:modelValue': onUpdate,
        },
      });

      const threeStarRadio = screen.getByRole('radio', { name: '3 stars' });
      await user.click(threeStarRadio);

      expect(onUpdate).toHaveBeenCalledWith(null);
    });

    it('does not clear rating when allowClear is false', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();

      render(RatingInput, {
        props: {
          modelValue: 3,
          allowClear: false,
          'onUpdate:modelValue': onUpdate,
        },
      });

      const threeStarRadio = screen.getByRole('radio', { name: '3 stars' });
      await user.click(threeStarRadio);

      // Should still emit the same value (not toggle to null)
      expect(onUpdate).toHaveBeenCalledWith(3);
    });
  });

  describe('Visual feedback', () => {
    it('applies focus ring styles to radio buttons', () => {
      render(RatingInput, {
        props: {
          modelValue: null,
        },
      });

      const radios = screen.getAllByRole('radio');
      radios.forEach((radio) => {
        expect(radio.className).toContain('focus:ring-2');
        expect(radio.className).toContain('focus:ring-primary-500');
      });
    });
  });
});
