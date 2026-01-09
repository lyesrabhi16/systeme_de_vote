import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { LucideMenu, LucideX } from 'lucide-react';
import { Link } from 'react-router';
import logo from '/logo.png';
import { Button } from '@/components/ui/button';
import { useNav } from '@/hooks/useNav';

const NavMenu = (props: { admin?: boolean }) => {
  const { navItems: menuItems, currentNavItem } = useNav({
    admin: props.admin,
  });

  return (
    <div>
      <div className='block sm:hidden'>
        <Drawer direction='left'>
          <DrawerTrigger asChild>
            <LucideMenu className='w-6 h-6' />
          </DrawerTrigger>

          <DrawerContent>
            <DrawerTitle className='flex flex-col flex-nowrap justify-center items-center'>
              <img src={logo} alt='logo' className='w-16 h-16 mt-2' />
              <div className='font-bold w-full font-monospace text-lg mb-4 p-2 flex flex-row justify-between items-center'>
                <p>Menu</p>
                <DrawerClose>
                  <Button variant='ghost' className='p-0 hover:bg-destructive'>
                    <span className='sr-only'>Close</span>
                    <LucideX className='w-6 h-6' />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerTitle>
            <div className='flex flex-col gap-4 p-4'>
              {menuItems.map((item) => (
                <Link
                  key={item.link}
                  to={item.link}
                  className='text-sm font-medium hover:underline'
                  hidden={item.hidden}
                >
                  <Button
                    variant='ghost'
                    className={`w-full justify-start ${
                      currentNavItem?.link === item.link
                        ? 'bg-primary text-primary-foreground'
                        : ''
                    }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
      <div className='hidden sm:flex flex-row gap-6'>
        {menuItems.map((item) => (
          <Link
            key={item.link}
            to={item.link}
            hidden={item.hidden}
            className={`text-sm font-medium hover:underline ${
              currentNavItem?.link === item.link ? 'text-primary' : ''
            }`}
          >
            <Button variant='ghost'>{item.label}</Button>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NavMenu;
