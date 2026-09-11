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

  it('exposes the recommended action as the description of a named trigger', () => {
    mockUseMedicationSideEffects.mockReturnValue({
      sideEffects: [
        { id: '1', name: 'Nausea', classification: 'COMMON' },
        { id: '2', name: 'Anaphylaxis', classification: 'SERIOUS', action: 'Stop the drug immediately' },
      ],
      error: null,
      isLoading: false,
    });

    render(<SideEffectsPanel drugUuid="drug-uuid" />);

    const trigger = screen.getByRole('button', { name: 'Recommended action' });
    expect(trigger).toHaveAccessibleDescription('Stop the drug immediately');
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('lists every side effect that shares a classification', () => {
    mockUseMedicationSideEffects.mockReturnValue({
      sideEffects: [
        { id: '1', name: 'Nausea', classification: 'COMMON' },
        { id: '2', name: 'Headache', classification: 'COMMON' },
        { id: '3', name: 'Dizziness', classification: 'COMMON' },
      ],
      error: null,
      isLoading: false,
    });

    render(<SideEffectsPanel drugUuid="drug-uuid" />);

    expect(screen.getAllByText('Common')).toHaveLength(1);
    expect(screen.getByText('Nausea')).toBeInTheDocument();
    expect(screen.getByText('Headache')).toBeInTheDocument();
    expect(screen.getByText('Dizziness')).toBeInTheDocument();
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
