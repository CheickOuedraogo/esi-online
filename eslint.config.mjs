// ESLint (flat config) : interdit d'importer le code back (src/server) depuis le front.
// Le back ne doit etre joignable que via l'API et les contrats partages (src/contracts).
export default [
  {
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/features/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
    ],
    ignores: ["src/app/api/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server", "@/server/*"],
              message:
                "src/server est reserve au back : importez uniquement les contrats (@/contracts) et passez par l'API.",
            },
          ],
        },
      ],
    },
  },
];
