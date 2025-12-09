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
  additionalLabel?: () => NavItemType;
}) => {
  const { navItems, currentNavItem } = useNav();

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
            <>
              <BreadcrumbItem key={item.label}>
                <BreadcrumbLink asChild>
                  <Link to={item.link}>{item.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {index < breadCrumbs.length - 1 && <BreadcrumbSeparator />}
            </>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };
  return component;
};
