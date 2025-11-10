import React, { createContext, useContext } from 'react';

const SheetCtx = createContext({ open: false, onOpenChange: () => {} });

export function Sheet({ open, onOpenChange, children }) {
  return (
    <SheetCtx.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetCtx.Provider>
  );
}

export function SheetTrigger({ asChild, children }) {
  const { onOpenChange } = useContext(SheetCtx);
  const child = React.Children.only(children);
  const props = {
    onClick: (e) => {
      child.props.onClick?.(e);
      onOpenChange(true);
    },
  };
  return asChild ? React.cloneElement(child, props) : (
    <button {...props}>{children}</button>
  );
}

export function SheetContent({ side = 'left', className = '', children }) {
  const { open, onOpenChange } = useContext(SheetCtx);
  if (!open) return null;
  const sideClasses = side === 'left' ? 'left-0' : 'right-0';
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={() => onOpenChange(false)} />
      <div className={`absolute top-0 ${sideClasses} h-full w-80 bg-white shadow-lg ${className}`}>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ className = '', children }) {
  return <div className={`p-4 border-b border-gray-100 ${className}`}>{children}</div>;
}

export function SheetTitle({ children }) {
  return <h3 className="text-base font-semibold text-gray-900">{children}</h3>;
}

export default Sheet;