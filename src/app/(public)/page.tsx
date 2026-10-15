// Landing page publique en une seule page : presentation, fonctionnalites,
// fonctionnement, contenus et appel a l'action. Un ecran d'accueil (splash)
// est affiche une fois par heure. Les sections glissent vers le centre au scroll.

import Image from 'next/image';
import Link from 'next/link';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Reveal } from '@/components/ui';

const PRIMARY_ON_DARK =
  'inline-flex h-12 items-center justify-center rounded-lg bg-cream px-8 text-base font-medium text-navy-900 shadow-sm transition-colors hover:bg-white active:bg-cream/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900';
const SECONDARY_ON_DARK =
  'inline-flex h-12 items-center justify-center rounded-lg border border-white/60 bg-white/10 px-8 text-base font-medium text-cream transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900';

const DOCUMENT_TYPES = ['Licence', 'Master', "Tests d'entrée"] as const;
const LEVELS = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'] as const;

const FEATURES = [
  {
    title: 'Recherche rapide',
    description:
      'Titre, matière, niveau ou type de document : trouvez ce que vous cherchez en quelques secondes.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Téléchargement gratuit',
    description:
      'Une fois votre compte validé, tous les documents de la bibliothèque sont téléchargeables sans limite.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 3v12m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Partage entre étudiants',
    description:
      'Proposez vos cours, TD et annales : l’équipe les valide puis les rend disponibles pour tous.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Contenus modérés',
    description:
      'Chaque document est vérifié par un administrateur pour garantir sa qualité et sa pertinence.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path
          d="M12 3 4.5 6v5c0 4.5 3.2 7.7 7.5 9.5 4.3-1.8 7.5-5 7.5-9.5V6L12 3Z"
          strokeLinejoin="round"
        />
        <path d="m9 11.5 2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const;

const STEPS = [
  {
    title: 'Créez votre compte',
    description: 'Indiquez votre nom, votre e-mail et votre niveau.',
  },
  {
    title: 'Votre compte est validé',
    description: 'Un administrateur vérifie votre demande et l’approuve rapidement.',
  },
  {
    title: 'Accédez à la bibliothèque',
    description: 'Parcourez, téléchargez et partagez tous les documents disponibles.',
  },
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600">— {children}</p>
  );
}

export default function HomePage() {
  return (
    <>
      <SplashScreen />
      <Header />
      <main className="bg-cream">
        <section className="relative overflow-hidden bg-gradient-to-b from-navy-800 to-navy-950 px-6 py-16 text-cream sm:py-20">
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-80 w-80 rounded-full bg-gold-400/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-gold-400/5 blur-3xl"
          />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="rounded-3xl bg-white p-4 shadow-2xl shadow-navy-950/40 motion-safe:animate-scale-in">
              <Image
                src="/logo.jpg"
                alt="ESI-Library"
                width={1075}
                height={976}
                priority
                className="w-full max-w-[240px] rounded-2xl object-contain sm:max-w-[300px]"
              />
            </div>
            <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">
              Les documents de l&apos;ESI, réunis au même endroit
            </h1>
            <p className="mt-3 max-w-xl text-sm text-cream/75 sm:text-base">
              Cours, TD, TP, examens, corrigés et mémoires&nbsp;: retrouvez tout ce qu&apos;il vous
              faut pour réussir, en quelques clics. Conçu pour les étudiants de l&apos;École
              Supérieure d&apos;Informatique.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row motion-safe:animate-fade-up">
              <Link href="/login" className={PRIMARY_ON_DARK}>
                Connexion
              </Link>
              <Link href="/register" className={SECONDARY_ON_DARK}>
                S&apos;inscrire
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <Reveal from="left">
              <SectionLabel>Présentation</SectionLabel>
              <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">
                Une bibliothèque numérique pensée pour la réussite des étudiants
              </h2>
              <p className="mt-4 max-w-2xl text-sm text-navy-600 sm:text-base">
                ESI-Library centralise les cours, travaux dirigés et pratiques, examens, corrigés,
                mémoires et annales de l&apos;école. Plus besoin de chercher sur des groupes ou des
                supports épars&nbsp;: tout est classé, modéré et accessible depuis votre espace
                étudiant.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} from={index % 2 === 0 ? 'left' : 'right'} delay={index * 90}>
                  <div className="h-full rounded-2xl border border-navy-100 bg-white p-5 shadow-sm shadow-navy-900/5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                      {feature.icon}
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-navy-900">{feature.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-navy-500">
                      {feature.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-navy-100 bg-white px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <Reveal from="left">
              <SectionLabel>Comment ça marche</SectionLabel>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">
                Trois étapes pour commencer
              </h2>
            </Reveal>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <Reveal key={step.title} from={index === 0 ? 'left' : index === 2 ? 'right' : 'up'} delay={index * 110}>
                  <li className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-300 bg-gold-50 text-sm font-bold text-gold-700">
                      {index + 1}
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-navy-900">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-navy-600">{step.description}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <Reveal from="left">
              <SectionLabel>Les contenus</SectionLabel>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">
                Licence, Master et tests d&apos;entrée
              </h2>
              <p className="mt-4 max-w-2xl text-sm text-navy-600 sm:text-base">
                La bibliothèque couvre tous les niveaux de l&apos;ESI, avec plusieurs types de
                documents.
              </p>
            </Reveal>
            <Reveal from="up">
              <div className="mt-8 flex flex-wrap gap-2.5">
                {DOCUMENT_TYPES.map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-navy-200 bg-white px-4 py-1.5 text-sm font-medium text-navy-700"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </Reveal>
            <div className="mt-8">
              <Reveal from="up">
                <div className="rounded-2xl border border-navy-100 bg-white p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-navy-500">
                    Niveaux
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {LEVELS.map((level) => (
                      <li
                        key={level}
                        className="rounded-lg border border-navy-100 bg-navy-50 px-3 py-1.5 text-sm font-medium text-navy-700"
                      >
                        {level}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 sm:py-20">
          <Reveal from="up" className="mx-auto max-w-3xl">
            <div className="rounded-3xl bg-gradient-to-b from-navy-800 to-navy-950 px-6 py-14 text-center text-cream shadow-lg shadow-navy-900/20">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Prêt à retrouver vos premiers documents&nbsp;?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-cream/75 sm:text-base">
                Ouvrez un compte gratuit en une minute et accédez à toute la bibliothèque dès la
                validation de votre profil.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/register" className={PRIMARY_ON_DARK}>
                  Créer mon compte
                </Link>
                <Link href="/login" className={SECONDARY_ON_DARK}>
                  J&apos;ai déjà un compte
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}