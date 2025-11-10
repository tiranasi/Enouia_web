import React, { useState, useRef, useEffect, useContext } from "react";

const MenuContext = React.createContext(null);

export function DropdownMenu({ children, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleDocClick = (e) => {
      const el = containerRef.current;
      if (!el) return;
      if (open && !el.contains(e.target)) {
        setOpen(false);
        onOpenChange?.(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onOpenChange]);

  const value = { open, setOpen, onOpenChange };

  return (
    <div ref={containerRef} className="relative inline-block">
      <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
    </div>
  );
}

export function DropdownMenuTrigger({ asChild, children, className, ...props }) {
  const ctx = useContext(MenuContext);
  const handleClick = (e) => {
    e.stopPropagation();
    const next = !ctx.open;
    ctx.setOpen(next);
    ctx.onOpenChange?.(next);
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (e) => {
        children.props.onClick?.(e);
        handleClick(e);
      },
      className: children.props.className,
    });
  }
  return (
    <button type="button" onClick={handleClick} className={className} {...props}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, className = "", align = "start", style, ...props }) {
  const ctx = useContext(MenuContext);
  if (!ctx?.open) return null;
  const alignClass = align === "end" ? "right-0" : "left-0";
  return (
    <div
      role="menu"
      aria-hidden={!ctx.open}
      className={`absolute ${alignClass} z-50 mt-2 min-w-[8rem] rounded-md border border-gray-200 bg-white shadow-lg p-1 ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, className = "", onClick, ...props }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}