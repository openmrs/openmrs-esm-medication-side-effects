import { defineConfigSchema, getAsyncLifecycle } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const moduleName = '@openmrs/esm-medication-side-effects-app';

const options = {
  featureName: 'medication-side-effects',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const sideEffectsPanel = getAsyncLifecycle(() => import('./side-effects-panel.component'), options);
