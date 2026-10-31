import logo from '/logo.png';
import { Link } from 'react-router';
import { routes } from '@/services/routing';
import { forwardRef } from 'react';

/** The mark and the name of the site. */
const Brand = forwardRef<HTMLAnchorElement, { admin?: boolean }>(
  ({ admin }, ref) => (
    <Link
      ref={ref}
      to={admin ? routes.ADMIN : routes.HOME}
      className='order-2 flex items-center gap-2.5 rounded-lg'
    >
      <img src={logo} alt='' className='size-9' />
      <span className='flex flex-col leading-tight'>
        <span className='font-display text-lg font-semibold tracking-tight'>
          SVS{admin && <span className='ml-1.5 text-primary'>Admin</span>}
        </span>
        <span className='hidden text-[11px] text-muted-foreground sm:block'>
          Système de vote sécurisé
        </span>
      </span>
    </Link>
  ),
);
Brand.displayName = 'Brand';

export default Brand;
