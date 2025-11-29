export const useNav = () => {
  const navItems = [
    { label: 'Home', link: '/' },
    { label: 'About', link: '/about' },
    { label: 'Contact', link: '/contact' },
  ];
  const currentNavItem =
    navItems.find((item) => item.link === window.location.pathname) || null;

  return {
    navItems,
    currentNavItem,
  };
};
