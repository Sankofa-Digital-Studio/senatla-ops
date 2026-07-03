# UI Architecture

## Component ownership

Page components are workflow coordinators. They may inject services, own signals, enforce permissions and execute domain actions. They should not duplicate stable controls or repeated record markup.

Shared UI components accept serializable inputs, emit plain events and inject no application service. This makes them independently renderable in tests and ready for Storybook stories without mocking Supabase, authentication or route state.

| Layer | Responsibility | Current examples |
|---|---|---|
| UI primitive | Stable visual and interaction contract | `UiButtonComponent`, `UiFeedbackComponent`, `UiTabNavComponent` |
| Shared domain display | Read-only projection used by multiple roles | `TimesheetSummaryComponent` |
| Feature component | Domain-specific presentation with input/output boundaries | `AttendanceRowComponent`, `AssetRegistrationWorkspaceComponent` |
| Page coordinator | State, permissions, service calls and navigation | Office Admin, Site Manager, Asset Register |
| Utility | Parameterized browser operation with no Angular dependency | `downloadTextFile`, `readFileAsDataUrl`, `toLocalDateKey` |

## Storybook readiness contract

1. A presentational component must be standalone.
2. It must render from inputs without an application service, router or global store.
3. User intent must be emitted as typed output events.
4. Loading, disabled, empty and narrow-screen states must be controllable through inputs.
5. Feature rules remain in the page or domain service; stories do not reproduce business logic.

## Deliberate boundaries

Generic tables, forms and modals are deferred. Their current domains have different validation, privacy and action rules; combining them would create configuration-heavy components that are harder to review than focused feature components.

The Office Admin asset form was removed because it bypassed controlled draft ownership, evidence and reminder behavior. Office Admin now links to the dedicated Asset Control workflow.

## Next Storybook phase

After remaining product blockers are complete, add Storybook and create stories for each shared component covering default, busy, disabled, empty, error and 390 px states. Story files should compose fixtures only and must not initialize runtime gateways.
