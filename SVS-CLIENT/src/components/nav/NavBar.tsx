import logo from '/logo.png';
import { Link } from 'react-router';
import { routes } from '@/services/routing';
import UserAvatarMenu from '@/components/nav/UserAvatarMenu';
import NavMenu from '@/components/nav/NavMenu';

const NavBar = () => {
  return (
    <div className='flex flex-row justify-between  items-center w-full h-16  py-2 px-4 gap-4'>
      <NavMenu />
      <Link to={routes.HOME}>
        <img src={logo} alt='Logo' className='w-16 h-16 mt-2' />
      </Link>
      <UserAvatarMenu />
    </div>
  );
};

export default NavBar;
