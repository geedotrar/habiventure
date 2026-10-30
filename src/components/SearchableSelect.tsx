"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { SearchIcon, ChevronDownIcon, CheckIcon, XIcon } from "@/components/Icons";

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface SearchableSelectProps {
  id?: string;
  options: SelectOption[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  disabled = false,
  style,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase().trim();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchSublabel = opt.sublabel?.toLowerCase().includes(q);
      return matchLabel || matchSublabel;
    });
  }, [options, searchTerm]);

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        userSelect: "none",
        ...style,
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: "100%",
          background: "var(--bg-surface-input, rgba(255, 255, 255, 0.05))",
          border: isOpen
            ? "1px solid var(--emerald-glow, #10B981)"
            : "1px solid var(--border-glass, rgba(255, 255, 255, 0.12))",
          borderRadius: "14px",
          padding: "11px 14px",
          color: selectedOption ? "#FFFFFF" : "var(--text-muted, #94A3B8)",
          fontSize: "13px",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.18s ease",
          boxShadow: isOpen
            ? "0 0 0 3px rgba(16, 185, 129, 0.2), 0 4px 14px rgba(0, 0, 0, 0.4)"
            : "none",
          textAlign: "left",
          gap: "10px",
          outline: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {selectedOption?.icon}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.sublabel && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted, #94A3B8)",
                fontWeight: "600",
              }}
            >
              {selectedOption.sublabel}
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            color: isOpen ? "var(--emerald-glow, #10B981)" : "var(--text-secondary, #94A3B8)",
            paddingLeft: "4px",
          }}
        >
          <ChevronDownIcon size={14} strokeWidth={2.5} />
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "#111827",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: "14px",
            boxShadow: "0 18px 45px rgba(0, 0, 0, 0.75), 0 0 25px rgba(16, 185, 129, 0.12)",
            overflow: "hidden",
            animation: "fadeIn 0.15s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 12px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.03)",
            }}
          >
            <SearchIcon size={14} color="var(--text-muted, #94A3B8)" style={{ flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: "600",
                padding: "2px 0",
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                }}
                aria-label="Clear search"
              >
                <XIcon size={10} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div
            style={{
              maxHeight: "190px",
              overflowY: "auto",
              padding: "5px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: "16px 12px",
                  textAlign: "center",
                  fontSize: "12px",
                  color: "var(--text-muted, #94A3B8)",
                  fontWeight: "600",
                }}
              >
                No options match &quot;{searchTerm}&quot;
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: isSelected ? "800" : "600",
                      color: isSelected ? "var(--emerald-glow, #10B981)" : "#E2E8F0",
                      background: isSelected
                        ? "rgba(16, 185, 129, 0.16)"
                        : "transparent",
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                      {opt.sublabel && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted, #94A3B8)",
                            fontWeight: "500",
                          }}
                        >
                          {opt.sublabel}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <CheckIcon
                        size={14}
                        color="var(--emerald-glow, #10B981)"
                        strokeWidth={2.5}
                        style={{ flexShrink: 0, marginLeft: "8px" }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
