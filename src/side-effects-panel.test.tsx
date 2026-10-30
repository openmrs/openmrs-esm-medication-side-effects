import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useConfig } from '@openmrs/esm-framework';
import SideEffectsPanel from './side-effects-panel.component';
import { useMedicationSideEffects } from './side-effects.resource';

vi.mock('./side-effects.resource');

const mockUseConfig = vi.mocked(useConfig);
const mockUseMedicationSideEffects = vi.mocked(useMedicationSideEffects);

describe('SideEffectsPanel', () => {
  beforeEach(() => {
    mockUseConfig.mockReturnValue({ displaySideEffects: true });
  });

  it('shows only a count per classification while collapsed', () => {
    mockUseMedicationSideEffects.mockReturnValue({
      sideEffects: [
        { id: '1', name: 'Nausea', classification: 'COMMON' },
        { id: '2', name: 'Headache', classification: 'COMMON' },
        { id: '3', name: 'Anaphylaxis', classification: 'SERIOUS', action: 'Stop the drug immediately' },
      ],
      error: null,
      isLoading: false,
    });

    render(<SideEffectsPanel drugUuid="drug-uuid" />);

    expect(screen.getByText('SIDE EFFECTS')).toBeInTheDocument();
    expect(screen.getByText('1 serious')).toBeInTheDocument();
    expect(screen.getByText('2 common')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show details' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Nausea')).not.toBeInTheDocument();
    expect(screen.queryByText(/Stop the drug immediately/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Counsel the patient/i)).not.toBeInTheDocument();
  });

  it('expands to every side effect with its recommended action and a counselling note, and collapses again', async () => {
    const user = userEvent.setup();
    mockUseMedicationSideEffects.mockReturnValue({
      sideEffects: [
        { id: '1', name: 'Nausea', classification: 'COMMON' },
        { id: '2', name: 'Anaphylaxis', classification: 'SERIOUS', action: 'Stop the drug immediately' },
      ],
      error: null,
      isLoading: false,
    });

    render(<SideEffectsPanel drugUuid="drug-uuid" />);

    await user.click(screen.getByRole('button', { name: 'Show details' }));

    const toggle = screen.getByRole('button', { name: 'Hide details' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const details = screen.getByRole('region', { name: 'Side effect details' });
    expect(toggle).toHaveAttribute('aria-controls', details.id);
    expect(within(details).getByText('Nausea')).toBeInTheDocument();
    expect(within(details).getByText('Anaphylaxis')).toBeInTheDocument();
    expect(within(details).getByText('Stop the drug immediately')).toBeInTheDocument();
    expect(within(details).getByText(/Counsel the patient/i)).toBeInTheDocument();

    await user.click(toggle);

    expect(screen.getByRole('button', { name: 'Show details' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: 'Side effect details' })).not.toBeInTheDocument();
  });

  it('orders the groups Serious, Common, then anything else, whatever order the records arrive in', async () => {
    const user = userEvent.setup();
    mockUseMedicationSideEffects.mockReturnValue({
      sideEffects: [
        { id: '1', name: 'Tinnitus', classification: 'RARE' },
        { id: '2', name: 'Nausea', classification: 'COMMON' },
        { id: '3', name: 'Anaphylaxis', classification: 'SERIOUS' },
      ],
      error: null,
      isLoading: false,
    });

    render(<SideEffectsPanel drugUuid="drug-uuid" />);
    await user.click(screen.getByRole('button', { name: 'Show details' }));

    const headings = screen.getAllByRole('heading').map((heading) => heading.textContent);
    expect(headings).toEqual(['Serious', 'Common', 'RARE']);
  });

  it('gives an unrecognised classification its own group instead of folding it into Common', () => {
    mockUseMedicationSideEffects.mockReturnValue({
      sideEffects: [
        { id: '1', name: 'Nausea', classification: 'COMMON' },
        { id: '2', name: 'Tinnitus', classification: 'RARE' },
      ],
      error: null,
      isLoading: false,
    });

    render(<SideEffectsPanel drugUuid="drug-uuid" />);

    expect(screen.getByText('1 common')).toBeInTheDocument();
    expect(screen.getByText('1 rare')).toBeInTheDocument();
  });

  it('renders nothing and does not fetch when the feature is disabled', () => {
    mockUseConfig.mockReturnValue({ displaySideEffects: false });
    mockUseMedicationSideEffects.mockReturnValue({ sideEffects: [], error: null, isLoading: false });

    const { container } = render(<SideEffectsPanel drugUuid="drug-uuid" />);

    expect(container).toBeEmptyDOMElement();
    expect(mockUseMedicationSideEffects).toHaveBeenCalledWith(undefined);
  });

  it('renders nothing when no drug is selected', () => {
    mockUseMedicationSideEffects.mockReturnValue({ sideEffects: [], error: null, isLoading: false });

    const { container } = render(<SideEffectsPanel />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing and logs when the side effects fail to load', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUseMedicationSideEffects.mockReturnValue({
      sideEffects: [],
      error: new Error('boom'),
      isLoading: false,
    });

    const { container } = render(<SideEffectsPanel drugUuid="drug-uuid" />);

    expect(container).toBeEmptyDOMElement();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders nothing when the drug has no recorded side effects', () => {
    mockUseMedicationSideEffects.mockReturnValue({ sideEffects: [], error: null, isLoading: false });

    const { container } = render(<SideEffectsPanel drugUuid="drug-uuid" />);

    expect(container).toBeEmptyDOMElement();
  });
});
