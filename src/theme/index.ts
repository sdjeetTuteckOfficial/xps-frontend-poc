import {
  createTheme,
  rem,
  type MantineColorsTuple,
  type MantineTheme,
} from '@mantine/core';

/**
 * PROFESSIONAL PALETTE GENERATION
 */
const corporateBlue: MantineColorsTuple = [
  '#eef3ff', // 0
  '#dce4f5', // 1
  '#b9c7e2', // 2
  '#94a8d0', // 3
  '#748dc1', // 4
  '#5f7cb8', // 5
  '#5474b4', // 6: BRAND COLOR
  '#44639f', // 7
  '#39588f', // 8
  '#2d4b81', // 9
];

const emeraldAccent: MantineColorsTuple = [
  '#e6ffee',
  '#d3f9e0',
  '#a8f2c0',
  '#7aea9f',
  '#53e383',
  '#3bdf71',
  '#2bdd68',
  '#1ac455',
  '#0caf49',
  '#00963c',
];

export const appTheme = createTheme({
  /**
   * COLOR CONFIGURATION
   */
  colors: {
    // No 'as any' needed anymore because the variables are strictly typed as Tuples
    blue: corporateBlue,
    emerald: emeraldAccent,
    primary: corporateBlue,
    secondary: emeraldAccent,
  },

  primaryColor: 'primary',
  primaryShade: { light: 6, dark: 8 },

  /**
   * TYPOGRAPHY HIERARCHY
   */
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif",
  fontFamilyMonospace: "Monaco, 'Courier New', monospace",

  fontSizes: {
    xs: rem(12),
    sm: rem(14),
    md: rem(16),
    lg: rem(18),
    xl: rem(20),
  },

  lineHeights: {
    xs: '1.4',
    sm: '1.45',
    md: '1.55',
    lg: '1.6',
    xl: '1.6',
  },

  headings: {
    fontFamily: "'Inter', sans-serif",
    sizes: {
      h1: { fontSize: rem(32), lineHeight: '1.3', fontWeight: '700' },
      h2: { fontSize: rem(26), lineHeight: '1.35', fontWeight: '600' },
      h3: { fontSize: rem(22), lineHeight: '1.4', fontWeight: '600' },
      h4: { fontSize: rem(18), lineHeight: '1.45', fontWeight: '600' },
    },
  },

  /**
   * RADIUS CONTROL
   */
  defaultRadius: 'sm',
  radius: {
    xs: rem(2),
    sm: rem(6),
    md: rem(8),
    lg: rem(12),
    xl: rem(24),
  },

  /**
   * COMPONENT DEFAULTS
   */
  components: {
    Button: {
      defaultProps: { size: 'md', fw: 500 },
    },
    TextInput: {
      defaultProps: { size: 'md' },
      // Mantine theme types are automatically inferred here
      styles: (theme: MantineTheme) => ({
        input: {
          // Use theme.colors.gray[0] safely
          backgroundColor: theme.colors.gray[0],
        },
      }),
    },
    Paper: {
      defaultProps: { shadow: 'sm', withBorder: true },
    },
  },
});
