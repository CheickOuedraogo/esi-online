# esi-online
Projet pour heberger les documents en rapport avec l'Ecole Supérieur D'informatique (ESI) situé à Bobo Dioulasso au sein de l'Université Nazi Boni (UNB)

## Développement front (branche `front`)

```bash
npm install
npm run dev        # http://localhost:3000 — API simulée par MSW (voir NEXT_PUBLIC_API_MOCKING)
npm run lint       # ESLint (TypeScript + règles Next)
npx tsc --noEmit   # vérification des types
npm run build      # build de production
```

Comptes de démonstration fournis par les mocks (`src/lib/mocks/handlers.ts`) :
`etudiant@esi.bf / password123` (validé), `enattente@esi.bf / password123` (en attente), `admin@esi.bf / admin1234`.

Le logo (`public/logo.jpg`) est la version générée par Gemini.
