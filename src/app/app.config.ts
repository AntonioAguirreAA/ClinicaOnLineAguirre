import { ApplicationConfig, provideZoneChangeDetection, InjectionToken } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { SupabaseClient } from '@supabase/supabase-js';
import { provideAnimations } from '@angular/platform-browser/animations';


export const SUPABASE = new InjectionToken<SupabaseClient>('supabase');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(),
    
    {
      provide: SUPABASE,
      useValue: createClient(environment.supabaseUrl, environment.supabaseKey),
    },
  ],
};
