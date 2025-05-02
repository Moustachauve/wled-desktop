import { Routes } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';

export const routes: Routes = [
  { path: 'index.html', component: NavigationComponent, pathMatch: 'full' },
  { path: '', redirectTo: 'index.html', pathMatch: 'full' },
  { path: '**', redirectTo: 'index.html', pathMatch: 'full' },
];
