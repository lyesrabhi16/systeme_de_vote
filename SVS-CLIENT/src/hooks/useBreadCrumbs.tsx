import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useNav } from '@/hooks/useNav';
import { Link } from 'react-router';
import type { NavItemType } from '@/hooks/useNav';
export const useBreadCrumbs = (props?: {
  admin?: boolean;
  additionalLabel?: () => NavItemType;
}) => {
  const { navItems, currentNavItem } = useNav({ admin: props?.admin });

  const homeNavItem = navItems[0];
  const breadCrumbs: NavItemType[] = currentNavItem
    ? [
        homeNavItem,
        currentNavItem.label == homeNavItem.label ? undefined : currentNavItem,
      ].filter((i) => i !== undefined)
    : [];
  if (props?.additionalLabel) {
    breadCrumbs.push(props.additionalLabel());
  }

  // jsx components for breadCrumbs
  const component = () => {
    return (
      <Breadcrumb className='w-full px-4 py-2 text-muted-foreground rounded-md'>
        <BreadcrumbList>
          {breadCrumbs.map((item, index) => (
            <div key={item.label} className='flex flex-row items-center gap-2'>
              <BreadcrumbItem key={item.label}>
                <BreadcrumbLink asChild>
                  <Link to={item.links[0]}>{item.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {index < breadCrumbs.length - 1 && <BreadcrumbSeparator />}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };
  return component;
};
