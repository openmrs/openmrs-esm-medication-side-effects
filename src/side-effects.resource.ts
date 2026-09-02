import useSWRImmutable from 'swr/immutable';
import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';

export interface SideEffect {
  id: string;
  name: string;
  classification?: string;
  action?: string;
}

interface MedicationSideEffectResult {
  uuid: string;
  display: string;
  classification?: string;
  sideEffectText?: string;
  recommendedAction?: string;
}

interface MedicationSideEffectResponse {
  results?: Array<MedicationSideEffectResult>;
}

/**
 * Fetches the known side effects for a drug from the medicationsideeffects backend module.
 *
 * Endpoint: GET /ws/rest/v1/medicationsideeffect?drug={drugUuid}
 */
export function useMedicationSideEffects(drugUuid?: string) {
  const url = drugUuid ? `${restBaseUrl}/medicationsideeffect?drug=${drugUuid}&v=default` : null;

  const { data, error, isLoading } = useSWRImmutable<{ data: MedicationSideEffectResponse }>(url, openmrsFetch);

  const sideEffects: Array<SideEffect> = (data?.data?.results ?? []).map((result) => ({
    id: result.uuid,
    name: result.display,
    classification: result.classification,
    action: result.recommendedAction,
  }));

  return { sideEffects, error, isLoading };
}
