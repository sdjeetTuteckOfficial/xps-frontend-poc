import {
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
} from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ActionIcon
      onClick={toggleColorScheme}
      variant='default'
      size='lg'
      radius='md'
      aria-label='Toggle color scheme'
    >
      {computedColorScheme === 'dark' ? (
        <IconSun stroke={1.5} size={20} />
      ) : (
        <IconMoon stroke={1.5} size={20} />
      )}
    </ActionIcon>
  );
}
