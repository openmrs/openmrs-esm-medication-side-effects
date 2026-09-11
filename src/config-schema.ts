import { Type } from '@openmrs/esm-framework';

export const configSchema = {
  displaySideEffects: {
    _type: Type.Boolean,
    _description:
      'Whether to display the medication side-effects panel wherever its extension slot is rendered by a host application.',
    _default: true,
  },
};

export interface ConfigObject {
  displaySideEffects: boolean;
}
