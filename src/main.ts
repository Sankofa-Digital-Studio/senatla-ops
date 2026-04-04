import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideBackendGateways } from './app/core/gateways/backend.providers';

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), ...provideBackendGateways()],
})
  .catch((err) => console.error(err));
