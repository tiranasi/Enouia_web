import React, { useState, useMemo } from 'react';

export function Tabs({ value, onValueChange, children }) {
  const [internal, setInternal] = useState(value || null);
  const current = value ?? internal;
  const ctx = useMemo(() => ({ current, setInternal, onValueChange }), [current, onValueChange]);
  return (
    <div data-tabs>{React.Children.map(children, (child) => React.cloneElement(child, { __tabs: ctx }))}</div>
  );
}

export function TabsList({ __tabs, children, className = '' }) {
  return (
    <div className={`flex border-b border-gray-100 ${className}`}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, { __tabs }) : child
      )}
    </div>
  );
}

export function TabsTrigger({ __tabs, value, children, className = '' }) {
  const active = __tabs?.current === value;
  const onClick = () => {
    __tabs?.setInternal?.(value);
    __tabs?.onValueChange?.(value);
  };
  return (
    <button
      className={`${className} ${active ? 'text-teal-600 border-b-2 border-teal-500' : 'text-gray-600'} bg-transparent`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function TabsContent({ __tabs, value, children, className = '' }) {
  if (__tabs?.current !== value) return null;
  return <div className={className}>{children}</div>;
}

export default Tabs;