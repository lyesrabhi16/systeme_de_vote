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
    //console.log('pushing additional Label: ', props.additionalLabel);

    breadCrumbs.push(props.additionalLabel());
  }

  // jsx components for breadCrumbs
  const component = () => {
    //console.log('breadCrumbs:', breadCrumbs);
    return (
      <Breadcrumb className='w-full py-3 text-muted-foreground'>
        <BreadcrumbList>
          {breadCrumbs.map((item, index) => {
            //console.log(item);

            return (
              <div
                key={item.label}
                className='flex flex-row items-center gap-2'
              >
                <BreadcrumbItem key={item.label}>
                  <BreadcrumbLink asChild>
                    <Link to={item.links[0]}>{item.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {index < breadCrumbs.length - 1 && <BreadcrumbSeparator />}
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };
  return component;
};
