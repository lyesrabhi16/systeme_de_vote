import AdminNavBar from '@/components/nav/AdminNavBar';
import NavBar from '@/components/nav/NavBar';
import { useBreadCrumbs } from '@/hooks/useBreadCrumbs';
import { LucideShieldCheck } from 'lucide-react';
import React from 'react';

/** The frame of every page: the header, the content (centred, with a readable width) and a footer. */
const AppContainer = (
  props: React.PropsWithChildren<{
    noBreadcrumbs?: boolean;
    admin?: boolean;
  }>,
) => {
  const BreadCrumbs = useBreadCrumbs({
    admin: props.admin,
  });
  return (
    <div className='bg-wash flex min-h-screen w-full flex-col'>
      <a
        href='#contenu'
        className='sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4'
      >
        Aller au contenu
      </a>
      {props.admin ? <AdminNavBar /> : <NavBar />}
      <main
        id='contenu'
        className='mx-auto flex w-full max-w-6xl flex-1 flex-col gap-2 px-4 pb-16 pt-4 sm:px-6'
      >
        {!props.noBreadcrumbs && <BreadCrumbs />}
        {props.children}
      </main>
      <footer className='border-t py-6 text-center text-xs text-muted-foreground'>
        <p className='inline-flex items-center gap-1.5'>
          <LucideShieldCheck className='size-3.5' />
          Les bulletins sont chiffrés dans votre navigateur ; le décompte peut
          être vérifié par tous.
        </p>
      </footer>
    </div>
  );
};

export default AppContainer;
