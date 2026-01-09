import logo from '/logo.png';
import { Link } from 'react-router';
import { routes } from '@/services/routing';
import UserAvatarMenu from '@/components/nav/UserAvatarMenu';
import NavMenu from '@/components/nav/NavMenu';
import { Button } from '@/components/ui/button';
import useAuth from '@/hooks/useAuth';
import { LucideArrowRightFromLine } from 'lucide-react';

const NavBar = () => {
  const auth = useAuth();
  return (
    <div className='flex flex-row justify-between  items-center w-full h-16  py-2 px-4 gap-4'>
      <NavMenu />
      <Link
        to={routes.HOME}
        className='flex flex-row items-center justify-center gap-2'
      >
        <img src={logo} alt='Logo' className='w-16 h-16 mt-2' />
        <span className='text-xl font-bold hidden lg:inline-block'>
          SVS - Système de Vote Sécurisé
        </span>
      </Link>

      <div className='flex flex-row gap-4 items-center'>
        {auth.user?.is_admin && (
          <Link to={routes.ADMIN} className='text-sm font-medium'>
            <Button variant='outline'>
              Admin Panel <LucideArrowRightFromLine />{' '}
            </Button>
          </Link>
        )}

        <UserAvatarMenu />
      </div>
    </div>
  );
};

export default NavBar;
