import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('renders common and serious side effects with a counselling note', () => {
    mockUseMedicationSideEffects.mockReturnValue({
      sideEffects: [
        { id: '1', name: 'Nausea', classification: 'COMMON' },
        { id: '2', name: 'Anaphylaxis', classification: 'SERIOUS', action: 'Stop the drug immediately' },
      ],
      error: null,
      isLoading: false,
    });

    render(<SideEffectsPanel drugUuid="drug-uuid" />);

    expect(screen.getByText('Common')).toBeInTheDocument();
    expect(screen.getByText('Serious')).toBeInTheDocument();
    expect(screen.getByText('Nausea')).toBeInTheDocument();
    expect(screen.getByText('Anaphylaxis')).toBeInTheDocument();
    expect(screen.getByText(/Counsel the patient/i)).toBeInTheDocument();
  });

  it('gives an unrecognised classification its own heading instead of folding it into Common', () => {
    mockUseMedicationSideEffects.mockReturnValue({
      sideEffects: [
        { id: '1', name: 'Nausea', classification: 'COMMON' },
        { id: '2', name: 'Tinnitus', classification: 'RARE' },
      ],
      error: null,
      isLoading: false,
    });

    render(<SideEffectsPanel drugUuid="drug-uuid" />);

    expect(screen.getByText('Common')).toBeInTheDocument();
    expect(screen.getByText('RARE')).toBeInTheDocument();
    expect(screen.getByText('Tinnitus')).toBeInTheDocument();
  });

  it('renders nothing when the feature is disabled', () => {
    mockUseConfig.mockReturnValue({ displaySideEffects: false });
    mockUseMedicationSideEffects.mockReturnValue({ sideEffects: [], error: null, isLoading: false });

    const { container } = render(<SideEffectsPanel drugUuid="drug-uuid" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no drug is selected', () => {
    mockUseMedicationSideEffects.mockReturnValue({ sideEffects: [], error: null, isLoading: false });

    const { container } = render(<SideEffectsPanel />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a warning notification when the side effects fail to load', () => {
    mockUseMedicationSideEffects.mockReturnValue({
      sideEffects: [],
      error: new Error('boom'),
      isLoading: false,
    });

    render(<SideEffectsPanel drugUuid="drug-uuid" />);

    expect(screen.getByText(/Unable to load side effects/i)).toBeInTheDocument();
  });
});
