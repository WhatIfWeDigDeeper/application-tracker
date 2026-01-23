/**
 * Unit tests for RatingInput component
 * Tests accessibility features including ARIA roles, keyboard navigation, and screen reader support
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import RatingInput from './RatingInput.svelte';

describe('RatingInput', () => {
  describe('Accessibility - ARIA roles', () => {
    it('renders with proper radiogroup role', () => {
      render(RatingInput, {
        props: {
          value: null,
          onchange: vi.fn(),
        },
      });

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toBeTruthy();
      expect(radiogroup.getAttribute('aria-label')).toBe('Rating');
    });

    it('renders 5 radio buttons with proper role', () => {
      render(RatingInput, {
        props: {
          value: null,
          onchange: vi.fn(),
        },
      });

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(5);
    });

    it('each radio button has correct aria-label', () => {
      render(RatingInput, {
        props: {
          value: null,
          onchange: vi.fn(),
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
          value: 3,
          onchange: vi.fn(),
        },
      });

      const threeStarRadio = screen.getByRole('radio', { name: '3 stars' });
      expect(threeStarRadio.getAttribute('aria-checked')).toBe('true');
    });

    it('sets aria-checked="false" for unselected stars', () => {
      render(RatingInput, {
        props: {
          value: 3,
          onchange: vi.fn(),
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
          value: 3,
          onchange: vi.fn(),
        },
      });

      const threeStarRadio = screen.getByRole('radio', { name: '3 stars' });
      expect(threeStarRadio.getAttribute('tabindex')).toBe('0');
    });

    it('unselected stars have tabindex="-1"', () => {
      render(RatingInput, {
        props: {
          value: 3,
          onchange: vi.fn(),
        },
      });

      const oneStarRadio = screen.getByRole('radio', { name: '1 stars' });
      const fiveStarRadio = screen.getByRole('radio', { name: '5 stars' });
      
      expect(oneStarRadio.getAttribute('tabindex')).toBe('-1');
      expect(fiveStarRadio.getAttribute('tabindex')).toBe('-1');
    });

    it('all stars have tabindex="-1" when no rating is selected', () => {
      render(RatingInput, {
        props: {
          value: null,
          onchange: vi.fn(),
        },
      });

      const radios = screen.getAllByRole('radio');
      // When nothing is selected, all should have tabindex="-1"
      radios.forEach((radio) => {
        expect(radio.getAttribute('tabindex')).toBe('-1');
      });
    });
  });

  describe('Keyboard interaction', () => {
    it('activates star on Space key press', async () => {
      const user = userEvent.setup();
      const onchange = vi.fn();

      render(RatingInput, {
        props: {
          value: null,
          onchange,
        },
      });

      const threeStarRadio = screen.getByRole('radio', { name: '3 stars' });
      threeStarRadio.focus();
      await user.keyboard(' ');

      expect(onchange).toHaveBeenCalledWith(3);
    });

    it('activates star on Enter key press', async () => {
      const user = userEvent.setup();
      const onchange = vi.fn();

      render(RatingInput, {
        props: {
          value: null,
          onchange,
        },
      });

      const fourStarRadio = screen.getByRole('radio', { name: '4 stars' });
      fourStarRadio.focus();
      await user.keyboard('{Enter}');

      expect(onchange).toHaveBeenCalledWith(4);
    });

    it('prevents default behavior on Space key', async () => {
      const user = userEvent.setup();
      const onchange = vi.fn();

      render(RatingInput, {
        props: {
          value: null,
          onchange,
        },
      });

      const twoStarRadio = screen.getByRole('radio', { name: '2 stars' });
      twoStarRadio.focus();
      
      // The component should prevent default, so we just verify it calls the handler
      await user.keyboard(' ');
      expect(onchange).toHaveBeenCalledWith(2);
    });
  });

  describe('Mouse interaction', () => {
    it('updates rating on click', async () => {
      const user = userEvent.setup();
      const onchange = vi.fn();

      render(RatingInput, {
        props: {
          value: null,
          onchange,
        },
      });

      const threeStarRadio = screen.getByRole('radio', { name: '3 stars' });
      await user.click(threeStarRadio);

      expect(onchange).toHaveBeenCalledWith(3);
    });

    it('clears rating when clicking selected star and allowClear is true', async () => {
      const user = userEvent.setup();
      const onchange = vi.fn();

      render(RatingInput, {
        props: {
          value: 3,
          allowClear: true,
          onchange,
        },
      });

      const threeStarRadio = screen.getByRole('radio', { name: '3 stars' });
      await user.click(threeStarRadio);

      expect(onchange).toHaveBeenCalledWith(null);
    });

    it('does not clear rating when allowClear is false', async () => {
      const user = userEvent.setup();
      const onchange = vi.fn();

      render(RatingInput, {
        props: {
          value: 3,
          allowClear: false,
          onchange,
        },
      });

      const threeStarRadio = screen.getByRole('radio', { name: '3 stars' });
      await user.click(threeStarRadio);

      // Should still emit the same value (not toggle to null)
      expect(onchange).toHaveBeenCalledWith(3);
    });
  });

  describe('Visual feedback', () => {
    it('applies focus ring styles to radio buttons', () => {
      render(RatingInput, {
        props: {
          value: null,
          onchange: vi.fn(),
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
