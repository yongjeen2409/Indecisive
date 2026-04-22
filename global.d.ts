declare module '*.jsx' {
  import type { ComponentType } from 'react';

  const Component: ComponentType<{ embedded?: boolean }>;
  export default Component;
}
