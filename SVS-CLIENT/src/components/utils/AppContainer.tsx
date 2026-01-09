import AdminNavBar from '@/components/nav/AdminNavBar';
import NavBar from '@/components/nav/NavBar';
import { useBreadCrumbs } from '@/hooks/useBreadCrumbs';
import React from 'react';

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
    <div className='flex flex-col flex-nowrap justify-start items-center h-screen w-full gap-2'>
      {props.admin ? <AdminNavBar /> : <NavBar />}
      {!props.noBreadcrumbs && <BreadCrumbs />}

      {props.children}
    </div>
  );
};

export default AppContainer;
