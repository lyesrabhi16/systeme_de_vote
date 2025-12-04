import NavBar from '@/components/nav/NavBar';
import { useBreadCrumbs } from '@/hooks/useBreadCrumbs';
import React from 'react';

const AppContainer = (
  props: React.PropsWithChildren<{
    noBreadcrumbs?: boolean;
  }>,
) => {
  const BreadCrumbs = useBreadCrumbs();
  return (
    <div className='flex flex-col flex-nowrap justify-start items-center h-screen w-full gap-2'>
      <NavBar />
      {!props.noBreadcrumbs && <BreadCrumbs />}

      {props.children}
    </div>
  );
};

export default AppContainer;
