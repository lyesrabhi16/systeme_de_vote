import { routes } from '@/services/routing';

const linkMatch = (links: string[], path: string): boolean => {
  for (const link of links) {
    // exact match
    if (link === path) {
      //console.log('link_match: exact match:', link, path);
      return true;
    }
    // dynamic route match (e.g., /vote/:voteId)
    const linkParts = link.split('/').filter((part) => part.length > 0);
    const pathParts = path.split('/').filter((part) => part.length > 0);
    //console.log('linkParts:', linkParts, 'pathParts:', pathParts);
    let isMatch = true;
    for (let i = 0; i < linkParts.length; i++) {
      if (i >= pathParts.length && linkParts[i].endsWith('?')) {
        //console.log('link_match: dynamic optional part missing but ok:', link, path);
        continue;
      }
      if (linkParts[i].startsWith(':')) {
        //console.log('link_match: dynamic part match:', link, path);
        continue; // dynamic part
      }
      if (linkParts[i] !== pathParts[i]) {
        //console.log('link_match: dynamic no match:', link, path);
        isMatch = false;
        break;
      }
    }
    if (isMatch) {
      //console.log('link_match: dynamic match:', link, path);
      return true;
    }
  }
  return false;
};
export const useNav: (props?: { admin?: boolean }) => {
  navItems: NavItemType[];
  currentNavItem: NavItemType | undefined;
  currentNavItemIndex: number;
} = (props?: { admin?: boolean }) => {
  const _navItems = [
    { label: 'Home', links: [routes.HOME], hidden: false },
    { label: 'About', links: [routes.ABOUT], hidden: false },
    { label: 'Contact', links: [routes.CONTACT], hidden: false },
    { label: 'Vote', links: [routes.VOTE], hidden: true },
  ];

  const AdminNavItems = [
    { label: 'Dashboard', links: [routes.ADMIN], hidden: false },
    {
      label: 'Users',
      links: [
        routes.PICK_USERS_ADMINISTRATION,
        routes.USERS_ADMINISTRATION,
        routes.ADMIN_ADMINISTRATION,
      ],
      hidden: false,
    },
    {
      label: 'Votes',
      links: [routes.VOTES_ADMINISTRATION, routes.VOTE_ADMINISTRATION],
      hidden: false,
    },
  ];

  const navItems: NavItemType[] = props?.admin ? AdminNavItems : _navItems;

  const path = window.location.pathname;
  let currentNavItem: NavItemType | undefined = undefined;
  let currentNavItemIndex: number = -1;

  for (const item of navItems) {
    const match = linkMatch(item.links, path);
    if (match) {
      currentNavItem = match ? item : currentNavItem;
      currentNavItemIndex = navItems.indexOf(item);
    }
  }
  //console.log('#currentNavItem: ', currentNavItem);

  return {
    navItems,
    currentNavItem,
    currentNavItemIndex,
  };
};

export type NavItemType = {
  label: string;
  links: string[];
  hidden?: boolean;
};
