import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { LucideMenu, LucideX } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useNav } from '@/hooks/useNav';
import { cn } from '@/lib/utils';
import Brand from '@/components/nav/Brand';

/** The links of the site: a row on a wide screen, a drawer on a narrow one. */
const NavMenu = (props: { admin?: boolean }) => {
  const { navItems, currentNavItem } = useNav({ admin: props.admin });
  const items = navItems.filter((item) => !item.hidden);
  const isCurrent = (item: (typeof navItems)[number]) =>
    currentNavItem?.links[0] === item.links[0];

  return (
    <>
      <div className='order-1 md:hidden'>
        <Drawer direction='left'>
          <DrawerTrigger asChild>
            <Button variant='ghost' size='icon' aria-label='Ouvrir le menu'>
              <LucideMenu />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className='flex items-center justify-between p-4'>
              <DrawerTitle asChild>
                <Brand admin={props.admin} />
              </DrawerTitle>
              <DrawerDescription className='sr-only'>
                Navigation
              </DrawerDescription>
              <DrawerClose asChild>
                <Button variant='ghost' size='icon' aria-label='Fermer'>
                  <LucideX />
                </Button>
              </DrawerClose>
            </div>
            <nav className='flex flex-col gap-1 p-4' aria-label='Navigation'>
              {items.map((item) => (
                <DrawerClose asChild key={item.links[0]}>
                  <Link
                    to={item.links[0]}
                    aria-current={isCurrent(item) ? 'page' : undefined}
                    className={cn(
                      'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent',
                      isCurrent(item) && 'bg-accent text-accent-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                </DrawerClose>
              ))}
            </nav>
          </DrawerContent>
        </Drawer>
      </div>
      <nav
        className='order-3 hidden items-center gap-1 md:flex'
        aria-label='Navigation'
      >
        {items.map((item) => (
          <Link
            key={item.links[0]}
            to={item.links[0]}
            aria-current={isCurrent(item) ? 'page' : undefined}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              isCurrent(item) && 'bg-accent text-accent-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
};

export default NavMenu;
