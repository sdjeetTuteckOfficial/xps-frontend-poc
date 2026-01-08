declare module 'react-cytoscapejs' {
  import { ReactNode } from 'react';

  interface CytoscapeComponentProps {
    elements?: any[];
    style?: React.CSSProperties;
    stylesheet?: any[];
    layout?: any;
    cy?: (cy: any) => void;
  }

  export default function CytoscapeComponent(
    props: CytoscapeComponentProps
  ): ReactNode;
}
