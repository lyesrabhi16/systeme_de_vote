import { Button } from '@/components/ui/button';
import { LucideMoon, LucideSun } from 'lucide-react';
import { useTheme } from 'next-themes';

/** Light / dark. The first choice follows the system; the toggle then remembers its own. */
const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Passer au thème clair' : 'Passer au thème sombre'}
      title={dark ? 'Thème clair' : 'Thème sombre'}
    >
      {dark ? <LucideSun /> : <LucideMoon />}
    </Button>
  );
};

export default ThemeToggle;
