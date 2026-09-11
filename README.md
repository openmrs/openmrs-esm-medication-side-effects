# OpenMRS ESM Medication Side Effects App

A [single-spa](https://single-spa.js.org/) microfrontend that displays the known side effects of a
medication. It is designed to be injected into host applications (the patient chart's medications /
order-basket app and the dispensing app) through **extension slots**, so the side-effects panel is
implemented and maintained in exactly one place.

## How it works

- The panel component is exported as `sideEffectsPanel` and registered as two extensions, one per slot:
  - `medication-side-effects-panel` in `drug-order-form-side-effects-slot` — rendered on the drug order form in the patient chart.
  - `medication-side-effects-panel-dispensing` in `dispensing-prescription-side-effects-slot` — rendered on the prescription details in the dispensing app.
- A host renders the slot and passes the selected drug's uuid via slot state, e.g.:

  ```tsx
  <ExtensionSlot name="drug-order-form-side-effects-slot" state={{ drugUuid }} />
  ```

- The panel reads side-effect data from the `medicationsideeffects` backend module over REST:

  ```
  GET /ws/rest/v1/medicationsideeffect?drug={drugUuid}
  ```

  Records are grouped into **Common** and **Serious**; each side effect with a recommended action
  shows a warning icon whose tooltip carries the counselling guidance.

## Configuration

| Key                  | Type    | Default | Description                                                             |
| -------------------- | ------- | ------- | ----------------------------------------------------------------------- |
| `displaySideEffects` | boolean | `true`  | When `false`, the panel renders nothing wherever its slot is mounted.   |

Because the flag lives in this microfrontend, a single configuration controls the feature everywhere
it is injected. It can still be scoped per slot through the standard OpenMRS extension configuration.

## Development

```sh
yarn        # install dependencies
yarn start  # run against a dev backend
yarn verify # lint, test and type-check
```

## Backend

Requires the [`medicationsideeffects`](https://github.com/openmrs/openmrs-module-medicationsideeffects)
OpenMRS module, which exposes the REST resource consumed here. Side-effect data is loaded via the
Initializer module.

Both extensions declare the `Get Medication Side Effects` privilege. The backend module registers it but
grants it to no role, so until the distribution grants it the panel is absent for every non-superuser,
with no request made and nothing logged.
