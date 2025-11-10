import React, { useState, useRef, useEffect, useContext } from "react";

const SelectContext = React.createContext(null);

export function Select({ value, defaultValue = "", onValueChange, children }) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value ?? defaultValue);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const containerRef = useRef(null);

  // Sync controlled value
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleDocClick = (e) => {
      const el = containerRef.current;
      if (!el) return;
      if (open && !el.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const setValue = (v, label) => {
    if (value === undefined) {
      setInternalValue(v);
    }
    setSelectedLabel(label ?? null);
    onValueChange?.(v);
    setOpen(false);
  };

  const ctx = {
    open,
    setOpen,
    value: internalValue,
    setValue,
    selectedLabel,
    setSelectedLabel,
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>
    </div>
  );
}

export function SelectTrigger({ children, className = "", ...props }) {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={ctx.open}
      onClick={(e) => {
        e.stopPropagation();
        ctx.setOpen(!ctx.open);
      }}
      className={`flex items-center justify-between w-full border border-gray-200 px-3 py-2 text-left text-sm rounded-md bg-white ${className}`}
      {...props}
    >
      {children}
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="ml-2 text-gray-500">
        <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function SelectValue({ placeholder = "请选择", className = "", ...props }) {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  return (
    <span className={`inline-flex items-center gap-2 text-gray-700 ${className}`} {...props}>
      {ctx.selectedLabel ?? (ctx.value ? String(ctx.value) : placeholder)}
    </span>
  );
}

export function SelectContent({ children, className = "", align = "start", style, ...props }) {
  const ctx = useContext(SelectContext);
  if (!ctx?.open) return null;
  const alignClass = align === "end" ? "right-0" : "left-0";
  return (
    <div
      role="listbox"
      className={`absolute ${alignClass} z-50 mt-2 w-full min-w-[8rem] rounded-md border border-gray-200 bg-white shadow-lg p-1 ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, children, className = "", ...props }) {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  const isSelected = ctx.value === value;
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 ${isSelected ? "bg-gray-50" : ""} ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        ctx.setValue(value, children);
      }}
      {...props}
    >
      {children}
    </button>
  );
}