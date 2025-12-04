export const useNav: () => {
  navItems: NavItemType[];
  currentNavItem: NavItemType | undefined;
  currentNavItemIndex: number;
} = () => {
  const navItems = [
    { label: 'Home', link: '/' },
    { label: 'About', link: '/about' },
    { label: 'Contact', link: '/contact' },
    { label: 'Vote', link: '/vote' },
  ];
  const path = window.location.pathname;
  let currentNavItem: NavItemType | undefined = undefined;
  let currentNavItemIndex: number = -1;

  for (const item of navItems) {
    const linkParts = item.link.split('/').filter((i) => i.length > 0);
    const IndexesToIgnore = linkParts
      .map((part, index) => (part.startsWith(':') ? index : -1))
      .filter((i) => i !== -1);
    const pathParts = path.split('/').filter((i) => i.length > 0);
    let match = true;
    for (let i = 0; i < linkParts.length; i++) {
      //console.log(`check linkpart : ${linkParts[i]} pathpart: ${pathParts[i]}`);

      if (IndexesToIgnore.includes(i)) {
        /* console.log(
          `check linkpart : ${linkParts[i]} pathpart: ${pathParts[i]}`,
        ); */

        continue;
      }
      if (linkParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }
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
  link: string;
};
