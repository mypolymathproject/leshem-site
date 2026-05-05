import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';

export default {
  ...MDXComponents,
  p: ({ children, ...props }) => (
    <p dir="auto" {...props}>{children}</p>
  ),
};
