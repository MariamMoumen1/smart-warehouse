import { Routes } from '@angular/router';
import { Overview } from './components/overview/overview';
import { Predictions } from './components/predictions/predictions';
import { Trucks } from './components/trucks/trucks';

export const routes: Routes = [
  { path: '', component: Overview },
  { path: 'predictions', component: Predictions },
  { path: 'trucks', component: Trucks },
  { path: '**', redirectTo: '' }
];
