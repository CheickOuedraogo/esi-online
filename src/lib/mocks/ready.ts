// Promesse resolue lorsque les mocks MSW sont prets (ou lorsque les mocks sont
// desactives). Le client API l'attend avant toute requete pour eviter les
// courses au demarrage du service worker.

let resolveReady: () => void = () => {};

export const mocksReady: Promise<void> = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

let ready = false;

export function markMocksReady(): void {
  if (ready) return;
  ready = true;
  resolveReady();
}
