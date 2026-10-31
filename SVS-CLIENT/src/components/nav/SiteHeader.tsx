import { Link } from 'react-router';
import { routes } from '@/services/routing';
import UserAvatarMenu from '@/components/nav/UserAvatarMenu';
import NavMenu from '@/components/nav/NavMenu';
import Brand from '@/components/nav/Brand';
import ThemeToggle from '@/components/nav/ThemeToggle';
import { Button } from '@/components/ui/button';
import useAuth from '@/hooks/useAuth';
import { LucideLayoutDashboard, LucideVote } from 'lucide-react';

/** The bar at the top of every page, for voters and for administrators. */
const SiteHeader = (props: { admin?: boolean }) => {
  const auth = useAuth();
  return (
    <header className='sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70'>
      <div className='mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6'>
        <NavMenu admin={props.admin} />
        <Brand admin={props.admin} />
        <div className='order-4 ml-auto flex items-center gap-1.5 sm:gap-2'>
          {props.admin ? (
            <Button asChild variant='outline' size='sm'>
              <Link to={routes.HOME}>
                <LucideVote /> <span className='hidden sm:inline'>Espace votant</span>
              </Link>
            </Button>
          ) : (
            auth.user?.is_admin && (
              <Button asChild variant='outline' size='sm'>
                <Link to={routes.ADMIN}>
                  <LucideLayoutDashboard />{' '}
                  <span className='hidden sm:inline'>Administration</span>
                </Link>
              </Button>
            )
          )}
          <ThemeToggle />
          <UserAvatarMenu />
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
