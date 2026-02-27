/* eslint-disable @typescript-eslint/no-empty-object-type */
import type React from 'react';

/**
 * TypeScript JSX declarations for Google's <model-viewer> web component.
 * @see https://modelviewer.dev/docs/
 */

interface ModelViewerAttributes {
  src?: string;
  'ios-src'?: string;
  poster?: string;
  alt?: string;
  ar?: boolean | string;
  'ar-modes'?: string;
  'ar-scale'?: string;
  'camera-controls'?: boolean | string;
  'auto-rotate'?: boolean | string;
  'shadow-intensity'?: string;
  'environment-image'?: string;
  exposure?: string;
  loading?: string;
  reveal?: string;
  ref?: React.Ref<HTMLElement>;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  slot?: string;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes & React.HTMLAttributes<HTMLElement>;
    }
  }
}
