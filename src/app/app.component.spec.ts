import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { resetTestStorage, TEST_APP_PROVIDERS } from './test-providers';

describe('AppComponent', () => {
  beforeEach(resetTestStorage);

  it('should create the app', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: TEST_APP_PROVIDERS,
    }).compileComponents();
    
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
