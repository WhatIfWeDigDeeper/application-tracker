/**
 * Tests for InterviewChecklist component
 * Verifies that individual stage operations (add, update, remove) are called correctly
 */

import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InterviewChecklist } from './InterviewChecklist';
import type { InterviewStage } from '@/types/application';

// Mock the generateId function to return predictable IDs
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  generateId: jest.fn(() => 'generated-id'),
  getCurrentDateISO: jest.fn(() => '2026-01-15'),
}));

describe('InterviewChecklist', () => {
  const createMockProps = () => ({
    stages: [] as InterviewStage[],
    onAddStage: jest.fn().mockResolvedValue(undefined),
    onUpdateStage: jest.fn().mockResolvedValue(undefined),
    onRemoveStage: jest.fn().mockResolvedValue(undefined),
    isEditable: true,
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe('adding stages', () => {
    it('calls onAddStage with correct data when adding new stages', async () => {
      const user = userEvent.setup();
      const existingStages: InterviewStage[] = [
        { id: 'stage-1', name: 'Phone Screen', order: 0, isCompleted: true },
        { id: 'stage-2', name: 'Technical', order: 1, isCompleted: false },
      ];

      const props = createMockProps();
      render(<InterviewChecklist {...props} stages={existingStages} />);

      await user.click(screen.getByRole('button', { name: /add stage/i }));

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/stage name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/stage name/i);
      await user.type(nameInput, 'Onsite');

      // Submit the form
      const form = nameInput.closest('form');
      const submitButton = form?.querySelector('button[type="submit"]');
      await user.click(submitButton!);

      // Verify onAddStage was called with correct order (max existing order + 1)
      await waitFor(() => {
        expect(props.onAddStage).toHaveBeenCalledTimes(1);
      });
      expect(props.onAddStage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'generated-id',
          name: 'Onsite',
          order: 2, // Should be max order + 1
          isCompleted: false,
        })
      );

      // Verify onUpdateStage and onRemoveStage were NOT called
      expect(props.onUpdateStage).not.toHaveBeenCalled();
      expect(props.onRemoveStage).not.toHaveBeenCalled();
    });
  });

  describe('updating stages', () => {
    it('calls onUpdateStage when editing an existing stage', async () => {
      const user = userEvent.setup();
      const existingStages: InterviewStage[] = [
        { id: 'stage-1', name: 'Phone Screen', order: 0, isCompleted: false },
      ];

      const props = createMockProps();
      render(<InterviewChecklist {...props} stages={existingStages} />);

      // Click the edit button to open the edit modal
      await user.click(screen.getByRole('button', { name: /edit phone screen/i }));

      // Change the name
      const nameInput = screen.getByLabelText(/stage name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Phone Screen');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      // Verify onUpdateStage was called
      expect(props.onUpdateStage).toHaveBeenCalledTimes(1);
      expect(props.onUpdateStage).toHaveBeenCalledWith(
        'stage-1',
        expect.objectContaining({
          name: 'Updated Phone Screen',
        })
      );

      // Verify onAddStage was NOT called
      expect(props.onAddStage).not.toHaveBeenCalled();
    });

    it('calls onUpdateStage when toggling completion', async () => {
      const user = userEvent.setup();
      const existingStages: InterviewStage[] = [
        { id: 'stage-1', name: 'Phone Screen', order: 0, isCompleted: false },
      ];

      const props = createMockProps();
      render(<InterviewChecklist {...props} stages={existingStages} />);

      // Click the completion toggle button
      const toggleButton = screen.getByRole('button', { name: /mark as complete/i });
      await user.click(toggleButton);

      // Verify onUpdateStage was called with isCompleted: true
      expect(props.onUpdateStage).toHaveBeenCalledTimes(1);
      expect(props.onUpdateStage).toHaveBeenCalledWith(
        'stage-1',
        expect.objectContaining({
          isCompleted: true,
          completedDate: '2026-01-15',
        })
      );
    });
  });

  describe('removing stages', () => {
    it('calls onRemoveStage when deleting a stage', async () => {
      const user = userEvent.setup();
      const existingStages: InterviewStage[] = [
        { id: 'stage-1', name: 'Phone Screen', order: 0, isCompleted: false },
      ];

      const props = createMockProps();
      render(<InterviewChecklist {...props} stages={existingStages} />);

      // Click the edit button to open the edit modal
      await user.click(screen.getByRole('button', { name: /edit phone screen/i }));

      // Click delete button
      await user.click(screen.getByRole('button', { name: /delete stage/i }));

      // Verify onRemoveStage was called
      expect(props.onRemoveStage).toHaveBeenCalledTimes(1);
      expect(props.onRemoveStage).toHaveBeenCalledWith('stage-1');

      // Verify onAddStage and onUpdateStage were NOT called
      expect(props.onAddStage).not.toHaveBeenCalled();
      expect(props.onUpdateStage).not.toHaveBeenCalled();
    });
  });

  describe('display', () => {
    it('shows empty state when no stages exist', () => {
      const props = createMockProps();
      render(<InterviewChecklist {...props} />);

      expect(screen.getByText(/no interview stages yet/i)).toBeInTheDocument();
    });

    it('shows progress bar with correct percentage', () => {
      const existingStages: InterviewStage[] = [
        { id: 'stage-1', name: 'Phone Screen', order: 0, isCompleted: true },
        { id: 'stage-2', name: 'Technical', order: 1, isCompleted: false },
      ];

      const props = createMockProps();
      render(<InterviewChecklist {...props} stages={existingStages} />);

      expect(screen.getByText('1 of 2 stages completed')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('hides add button when not editable', () => {
      const props = createMockProps();
      render(<InterviewChecklist {...props} isEditable={false} />);

      expect(screen.queryByRole('button', { name: /add stage/i })).not.toBeInTheDocument();
    });
  });

  describe('default stages', () => {
    it('calls onAddStage for each default stage when using defaults', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      render(<InterviewChecklist {...props} />);

      // Click "Use Default Stages" button
      await user.click(screen.getByRole('button', { name: /use default stages/i }));

      // Should call onAddStage multiple times (once per default stage)
      await waitFor(() => {
        expect((props.onAddStage as jest.Mock).mock.calls.length).toBeGreaterThan(0);
      });

      // Verify onRemoveStage was not called (not setInterviewStages batch operation)
      expect(props.onRemoveStage).not.toHaveBeenCalled();
    });
  });
});
