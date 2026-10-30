import openmrs from '@openmrs/eslint-config';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  { ignores: ['dist/**', 'coverage/**'] },
  ...openmrs,
  {
    plugins: { 'unused-imports': unusedImports },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
