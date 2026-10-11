// Configuration du navigateur MSW (worker) pour les mocks en developpement.

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
