// components/ui/Select.jsx - Shadcn style Select
import React, { useEffect, useRef, useState } from "react";
/* eslint-disable no-empty */
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "../../utils/cn";
import Button from "./Button";
import Input from "./Input";

const Select = React.forwardRef(({
    className,
    options = [],
    value,
    defaultValue,
    placeholder = "Select an option",
    multiple = false,
    disabled = false,
    required = false,
    label,
    description,
    error,
    searchable = false,
    clearable = false,
    loading = false,
    id,
    name,
    onChange,
    onValueChange,
    onOpenChange,
    ...props
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Generate unique ID if not provided
    const selectId = id || `select-${Math.random()?.toString(36)?.substr(2, 9)}`;

    // Filter options based on search
    const filteredOptions = searchable && searchTerm
        ? options?.filter(option =>
            option?.label?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
            (option?.value && option?.value?.toString()?.toLowerCase()?.includes(searchTerm?.toLowerCase()))
        )
        : options;

    // Get selected option(s) for display
    const getSelectedDisplay = () => {
        if (!value) return placeholder;

        if (multiple) {
            const selectedOptions = options?.filter(opt => value?.includes(opt?.value));
            if (selectedOptions?.length === 0) return placeholder;
            if (selectedOptions?.length === 1) return selectedOptions?.[0]?.label;
            return `${selectedOptions?.length} items selected`;
        }

        const selectedOption = options?.find(opt => opt?.value === value);
        return selectedOption ? selectedOption?.label : placeholder;
    };

    const handleToggle = () => {
        if (!disabled) {
            const newIsOpen = !isOpen;
            setIsOpen(newIsOpen);
            onOpenChange?.(newIsOpen);
            if (!newIsOpen) {
                setSearchTerm("");
            }
        }
    };

    const handleOptionSelect = (option) => {
        if (multiple) {
            const newValue = value || [];
            const updatedValue = newValue?.includes(option?.value)
                ? newValue?.filter(v => v !== option?.value)
                : [...newValue, option?.value];
            onValueChange?.(updatedValue) || onChange?.(updatedValue);
        } else {
            onValueChange?.(option?.value) || onChange?.(option?.value);
            setIsOpen(false);
            onOpenChange?.(false);
        }
    };

    const handleClear = (e) => {
        e?.stopPropagation();
        onValueChange?.(multiple ? [] : '') || onChange?.(multiple ? [] : '');
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e?.target?.value);
    };

    const isSelected = (optionValue) => {
        if (multiple) {
            return value?.includes(optionValue) || false;
        }
        return value === optionValue;
    };

    const hasValue = multiple ? value?.length > 0 : value !== undefined && value !== '';

    // Portal container setup and positioning
    const portalContainerRef = useRef(null);
    const triggerRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState({});

    useEffect(() => {
        // create portal container once
        if (!portalContainerRef.current) {
            const el = document.createElement("div");
            el.setAttribute("data-select-portal", "true");
            el.style.position = "absolute";
            el.style.top = "0";
            el.style.left = "0";
            el.style.width = "0";
            el.style.height = "0";
            document.body.appendChild(el);
            portalContainerRef.current = el;
        }
        return () => {
            if (portalContainerRef.current) {
                try {
                    document.body.removeChild(portalContainerRef.current);
                } catch {}
                portalContainerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!isOpen || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        const scrollX = window.scrollX || document.documentElement.scrollLeft || 0;
        const width = rect.width;
        const top = rect.bottom + scrollY + 4; // small gap
        const left = rect.left + scrollX;

        // prevent horizontal overflow
        const maxLeft = scrollX + window.innerWidth - width - 8;
        const adjustedLeft = Math.min(left, maxLeft);

        setMenuStyle({
            position: "absolute",
            top: `${top}px`,
            left: `${Math.max(adjustedLeft, scrollX + 8)}px`,
            width: `${width}px`,
            zIndex: 2147483647 // max stacking context
        });
    }, [isOpen]);

    return (
        <div className={cn("relative", className)}>
            {label && (
                <label
                    htmlFor={selectId}
                    className={cn(
                        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block",
                        error ? "text-destructive" : "text-foreground"
                    )}
                >
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <button
                    ref={(node) => {
                        if (typeof ref === 'function') ref(node);
                        else if (ref) ref.current = node;
                        triggerRef.current = node;
                    }}
                    id={selectId}
                    type="button"
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white text-black px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-destructive focus:ring-destructive",
                        !hasValue && "text-muted-foreground"
                    )}
                    onClick={handleToggle}
                    disabled={disabled}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    {...props}
                >
                    <span className="truncate">{getSelectedDisplay()}</span>

                    <div className="flex items-center gap-1">
                        {loading && (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        )}

                        {clearable && hasValue && !loading && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={handleClear}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}

                        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </div>
                </button>

                {/* Hidden native select for form submission */}
                <select
                    name={name}
                    value={value || ''}
                    onChange={() => { }} // Controlled by our custom logic
                    className="sr-only"
                    tabIndex={-1}
                    multiple={multiple}
                    required={required}
                >
                    <option value="">Select...</option>
                    {options?.map(option => (
                        <option key={option?.value} value={option?.value}>
                            {option?.label}
                        </option>
                    ))}
                </select>

                {/* Dropdown rendered in a true portal to escape overflow clipping */}
                {isOpen && portalContainerRef.current && createPortal(
                    <div style={menuStyle}>
                        <div className="bg-white text-black border border-border rounded-md shadow-lg max-h-80 overflow-auto w-full z-[2147483647]">
                            {searchable && (
                                <div className="p-2 border-b bg-white sticky top-0 z-10">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search options..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="py-1">
                                {filteredOptions?.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                        {searchTerm ? 'No options found' : 'No options available'}
                                    </div>
                                ) : (
                                    filteredOptions?.map((option) => (
                                        <div
                                            key={option?.value}
                                            className={cn(
                                                "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                isSelected(option?.value) && "bg-primary text-primary-foreground",
                                                option?.disabled && "pointer-events-none opacity-50"
                                            )}
                                            onClick={() => !option?.disabled && handleOptionSelect(option)}
                                        >
                                            <span className="flex-1">{option?.label}</span>
                                            {multiple && isSelected(option?.value) && (
                                                <Check className="h-4 w-4" />
                                            )}
                                            {option?.description && (
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    {option?.description}
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>,
                    portalContainerRef.current
                )}
            </div>
            {description && !error && (
                <p className="text-sm text-muted-foreground mt-1">
                    {description}
                </p>
            )}
            {error && (
                <p className="text-sm text-destructive mt-1">
                    {error}
                </p>
            )}
        </div>
    );
});

Select.displayName = "Select";

export default Select;
