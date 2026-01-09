import logo from '/logo.png';
import { Link } from 'react-router';
import { routes } from '@/services/routing';
import UserAvatarMenu from '@/components/nav/UserAvatarMenu';
import { Button } from '@/components/ui/button';
import { LucideArrowRightFromLine } from 'lucide-react';
import NavMenu from '@/components/nav/NavMenu';

const AdminNavBar = () => {
  return (
    <div className='flex flex-row justify-between  items-center w-full h-16  py-2 px-4 gap-4'>
      <NavMenu admin/>
      <Link
        to={routes.ADMIN}
        className='flex flex-row items-center justify-center gap-2'
      >
        <img src={logo} alt='Logo' className='w-16 h-16 mt-2' />
        <span className='text-xl font-bold hidden lg:inline-block'>
          SVS - Système de Vote Sécurisé - ADMIN
        </span>
      </Link>
      <div className='flex flex-row gap-4 items-center'>
        <Link to={routes.HOME} className='text-sm font-medium'>
          <Button variant='outline'>
            User Panel <LucideArrowRightFromLine />{' '}
          </Button>
        </Link>

        <UserAvatarMenu />
      </div>
    </div>
  );
};

export default AdminNavBar;
