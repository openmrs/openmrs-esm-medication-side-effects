import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { type FetchResponse, openmrsFetch } from '@openmrs/esm-framework';
import { useMedicationSideEffects } from './side-effects.resource';

const mockOpenmrsFetch = vi.mocked(openmrsFetch);

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(SWRConfig, { value: { provider: () => new Map(), dedupingInterval: 0 } }, children);

describe('useMedicationSideEffects', () => {
  beforeEach(() => {
    mockOpenmrsFetch.mockReset();
  });

  it('requests the drug-scoped default representation and maps each result', async () => {
    mockOpenmrsFetch.mockResolvedValue({
      data: {
        results: [
          { uuid: 'se-1', display: 'Nausea', classification: 'COMMON', recommendedAction: null },
          { uuid: 'se-2', display: 'Anaphylaxis', classification: 'SERIOUS', recommendedAction: 'Stop the drug' },
        ],
      },
    } as unknown as FetchResponse);

    const { result } = renderHook(() => useMedicationSideEffects('drug-abc'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockOpenmrsFetch).toHaveBeenCalledWith('/ws/rest/v1/medicationsideeffect?drug=drug-abc&v=default');
    expect(result.current.sideEffects).toEqual([
      { id: 'se-1', name: 'Nausea', classification: 'COMMON', action: null },
      { id: 'se-2', name: 'Anaphylaxis', classification: 'SERIOUS', action: 'Stop the drug' },
    ]);
    expect(result.current.error).toBeFalsy();
  });

  it('does not hit the network when no drug uuid is supplied', () => {
    const { result } = renderHook(() => useMedicationSideEffects(undefined), { wrapper });

    expect(mockOpenmrsFetch).not.toHaveBeenCalled();
    expect(result.current.sideEffects).toEqual([]);
  });
});
