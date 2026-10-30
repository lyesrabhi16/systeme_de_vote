import logo from '/logo.png';
import ThemeToggle from '@/components/nav/ThemeToggle';
import { LucideEye, LucideLockKeyhole, LucideShieldCheck } from 'lucide-react';
import type { PropsWithChildren } from 'react';

const points = [
  {
    icon: LucideLockKeyhole,
    title: 'Chiffré avant d\'être envoyé',
    text: 'Votre bulletin est chiffré dans votre navigateur, avec une preuve qu\'il est valide.',
  },
  {
    icon: LucideShieldCheck,
    title: 'Un électeur, une voix',
    text: 'Connexion en deux étapes, et un seul bulletin par élection.',
  },
  {
    icon: LucideEye,
    title: 'Un décompte vérifiable',
    text: 'Tous les bulletins sont publics, sans nom : chacun peut refaire le décompte.',
  },
];

/** The sign-in pages: what the service promises on the left (from a tablet up), the form on the right. */
const AuthLayout = (props: PropsWithChildren) => (
  <div className='grid min-h-screen w-full lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]'>
    <aside className='relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between'>
      <div
        aria-hidden
        className='pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-primary-foreground/10 blur-3xl'
      />
      <div className='relative flex items-center gap-3'>
        <span className='flex size-11 items-center justify-center rounded-xl bg-primary-foreground/95'>
          <img src={logo} alt='' className='size-8' />
        </span>
        <span className='font-display text-2xl font-semibold'>SVS</span>
      </div>
      <div className='relative flex max-w-md flex-col gap-10'>
        <h2 className='text-4xl font-semibold leading-tight'>Voter en ligne, sans avoir à croire sur parole.</h2>
        <ul className='flex flex-col gap-6'>
          {points.map((p) => (
            <li key={p.title} className='flex gap-4'>
              <span className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15'>
                <p.icon className='size-4.5' />
              </span>
              <div>
                <p className='font-medium'>{p.title}</p>
                <p className='text-sm text-primary-foreground/75'>{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className='relative text-xs text-primary-foreground/60'>Projet long M1 Logiciels Sûrs · Université Paris-Est Créteil</p>
    </aside>
    <main className='relative flex flex-col items-center justify-center px-4 py-12 sm:px-8'>
      <div className='absolute right-4 top-4'>
        <ThemeToggle />
      </div>
      <div className='mb-8 flex items-center gap-2.5 lg:hidden'>
        <img src={logo} alt='' className='size-10' />
        <span className='font-display text-2xl font-semibold'>SVS</span>
      </div>
      {props.children}
    </main>
  </div>
);

export default AuthLayout;
