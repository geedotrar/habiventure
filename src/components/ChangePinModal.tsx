"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { User } from "@/types/domain";
import { Mascot } from "@/components/Mascot";
import { KeyIcon, ShieldIcon, XIcon, CheckCircleIcon, CheckIcon, AlertTriangleIcon, UsersIcon, PlusIcon, SpinnerIcon } from "@/components/Icons";
import { gameFeedback } from "@/utils/gameFeedback";
import { SearchableSelect, type SelectOption } from "@/components/SearchableSelect";

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  allUsers?: User[];
  targetUserId?: number;
  initialMode?: "edit" | "register";
  onPinChanged?: (message: string, updatedUser?: User) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers = [],
  targetUserId,
  initialMode = "edit",
  onPinChanged,
}) => {
  const isSuperAdmin = currentUser?.role === "superadmin";

  const [mode, setMode] = useState<"edit" | "register">(initialMode);
  const [selectedUserId, setSelectedUserId] = useState<number>(targetUserId || currentUser?.id || 1);
  const [partnerId, setPartnerId] = useState<number>(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [role, setRole] = useState<"user" | "superadmin">("user");
  const [active, setActive] = useState(true);

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPins, setShowPins] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadUserData = useCallback((userId: number) => {
    const user = allUsers.find((u) => u.id === userId) || (userId === currentUser?.id ? currentUser : null);
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setGender(user.gender || (user.id === 3 ? "female" : "male"));
      setRole(user.role || "user");
      setActive(user.active !== false);
      setPartnerId(user.partner_id ? Number(user.partner_id) : 0);
    } else {
      setName(userId === 2 ? "Player A" : userId === 3 ? "Player B" : "Super Admin");
      setPhone("");
      setGender(userId === 3 ? "female" : "male");
      setRole(userId === 1 ? "superadmin" : "user");
      setActive(true);
      setPartnerId(0);
    }
    setNewPin("");
    setConfirmPin("");
    setError(null);
  }, [allUsers, currentUser]);

  const resetForRegister = useCallback(() => {
    setName("");
    setPhone("");
    setGender("male");
    setRole("user");
    setActive(true);
    setPartnerId(0);
    setNewPin("");
    setConfirmPin("");
    setError(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const activeMode = initialMode || "edit";
      setMode(activeMode);
      setError(null);
      setSuccess(null);

      if (activeMode === "register") {
        resetForRegister();
      } else {
        const initialId = targetUserId || currentUser?.id || (allUsers[0]?.id ?? 1);
        setSelectedUserId(initialId);
        loadUserData(initialId);
      }
    }
  }, [isOpen, targetUserId, initialMode, currentUser?.id, allUsers, loadUserData, resetForRegister]);

  const handleUserSelectChange = (newId: number) => {
    setSelectedUserId(newId);
    loadUserData(newId);
  };

  const handleTabChange = (newMode: "edit" | "register") => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    if (newMode === "register") {
      resetForRegister();
    } else {
      const initialId = targetUserId || currentUser?.id || (allUsers[0]?.id ?? 1);
      setSelectedUserId(initialId);
      loadUserData(initialId);
    }
  };

  if (!isOpen) return null;

  const getPartnerOptions = (): SelectOption[] => {
    const baseOptions: SelectOption[] = [
      {
        value: 0,
        label: "Solo / No Partner",
        sublabel: "Independent habit tracking without duo target",
      },
    ];

    const eligibleUsers = allUsers.filter((u) => {
      if (mode === "edit" && u.id === selectedUserId) return false;
      if (u.role === "superadmin") return false;
      return true;
    });

    const partnerItems: SelectOption[] = eligibleUsers.map((u) => {
      let sublabel = "Available for pairing";
      if (mode === "edit" && u.partner_id === selectedUserId) {
        sublabel = "Currently paired with this account";
      } else if (u.partner_id) {
        sublabel = `Paired with ${u.partner_name || "another player"}`;
      }

      const effectiveG = u.gender || (u.id === 3 ? "female" : "male");
      return {
        value: u.id,
        label: `${u.name} (${effectiveG === "female" ? "Female" : "Male"})`,
        sublabel,
      };
    });

    return [...baseOptions, ...partnerItems];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isSuperAdmin) {
      setError("Access denied. Only Super Admin can manage user accounts.");
      gameFeedback.haptic([100, 50, 100]);
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Full name is required.");
      gameFeedback.haptic([100, 50, 100]);
      return;
    }

    if (mode === "register") {
      const trimmedPin = newPin.trim();
      if (!trimmedPin || !/^\d{4}$/.test(trimmedPin)) {
        setError("Account PIN is required and must consist of exactly 4 numeric digits (0-9).");
        gameFeedback.haptic([100, 50, 100]);
        return;
      }
      if (trimmedPin !== confirmPin.trim()) {
        setError("PIN confirmation does not match.");
        gameFeedback.haptic([100, 50, 100]);
        return;
      }
    } else {
      if (newPin) {
        const trimmedPin = newPin.trim();
        if (!/^\d{4}$/.test(trimmedPin)) {
          setError("New PIN must consist of exactly 4 numeric digits (0-9).");
          gameFeedback.haptic([100, 50, 100]);
          return;
        }

        if (trimmedPin !== confirmPin.trim()) {
          setError("New PIN confirmation does not match.");
          gameFeedback.haptic([100, 50, 100]);
          return;
        }
      }
    }

    try {
      setLoading(true);

      const resolvedPartnerId = role === "superadmin" ? null : (partnerId > 0 ? partnerId : null);

      if (mode === "register") {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminUserId: currentUser?.id,
            user: {
              name: trimmedName,
              phone: phone.trim(),
              gender,
              role,
              active: true,
              pin: newPin.trim(),
              partnerId: resolvedPartnerId,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to create user account.");
        }

        gameFeedback.playSuccessChime();
        gameFeedback.haptic([40, 70]);
        setSuccess(data.message || `Account '${trimmedName}' created successfully!`);
        onPinChanged?.(data.message || `Account '${trimmedName}' created!`, data.user);

        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        const targetExistingUser = allUsers.find((u) => u.id === selectedUserId);
        const resolvedName = trimmedName || targetExistingUser?.name || "";
        const resolvedRole = selectedUserId === 1 ? "superadmin" : (role || targetExistingUser?.role || "user");

        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminUserId: currentUser?.id,
            targetUserId: selectedUserId,
            updates: {
              name: resolvedName,
              phone: phone.trim(),
              gender,
              role: resolvedRole,
              active,
              newPin: newPin ? newPin.trim() : undefined,
              partnerId: resolvedPartnerId,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to update user account.");
        }

        gameFeedback.playSuccessChime();
        gameFeedback.haptic([40, 70]);
        setSuccess(data.message || `Account '${trimmedName}' saved successfully!`);
        onPinChanged?.(data.message || `Account '${trimmedName}' updated!`, data.user);

        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while saving user data.";
      setError(msg);
      gameFeedback.haptic([120, 60, 120]);
    } finally {
      setLoading(false);
    }
  };

  const previewAvatar = gender === "female" ? "female" : "male";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="neo-card animate-pop"
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "linear-gradient(145deg, rgba(20, 26, 22, 0.98), rgba(11, 17, 13, 0.98))",
          border: "1px solid rgba(16, 185, 129, 0.4)",
          borderRadius: "24px",
          padding: "20px 16px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(16, 185, 129, 0.15)",
          position: "relative",
          maxHeight: "90dvh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-pin-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
            <Mascot character={previewAvatar} size={38} mood="idle" animation="none" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: "10px", fontWeight: "900", color: "#10B981", letterSpacing: "1px", textTransform: "uppercase" }}>
                SUPER ADMIN USER CONSOLE
              </span>
              <h3 id="change-pin-modal-title" style={{ fontSize: "16px", fontWeight: "900", color: "#FFFFFF", margin: "2px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {mode === "register" ? "Register New User Account" : "Edit Account & Duo Pairing"}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neo-btn neo-btn-glass"
            style={{ minWidth: "44px", minHeight: "44px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            aria-label="Close dialog"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
            background: "rgba(0, 0, 0, 0.4)",
            padding: "4px",
            borderRadius: "14px",
            border: "1px solid var(--border-subtle)",
            marginBottom: "16px",
          }}
        >
          <button
            type="button"
            onClick={() => handleTabChange("edit")}
            style={{
              padding: "8px 6px",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: "800",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: mode === "edit" ? "rgba(16, 185, 129, 0.2)" : "transparent",
              color: mode === "edit" ? "var(--emerald-glow)" : "var(--text-secondary)",
              boxShadow: mode === "edit" ? "0 2px 8px rgba(16, 185, 129, 0.2)" : "none",
            }}
          >
            <UsersIcon size={14} />
            <span>Manage Accounts</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("register")}
            style={{
              padding: "8px 6px",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: "800",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: mode === "register" ? "rgba(16, 185, 129, 0.2)" : "transparent",
              color: mode === "register" ? "var(--emerald-glow)" : "var(--text-secondary)",
              boxShadow: mode === "register" ? "0 2px 8px rgba(16, 185, 129, 0.2)" : "none",
            }}
          >
            <PlusIcon size={14} />
            <span>Register New User</span>
          </button>
        </div>

        {success && (
          <div
            className="animate-pop"
            style={{
              padding: "12px 14px",
              borderRadius: "14px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "var(--emerald-glow)",
              fontSize: "12px",
              fontWeight: "800",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircleIcon size={16} color="var(--emerald-glow)" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div
            className="animate-pop"
            style={{
              padding: "12px 14px",
              borderRadius: "14px",
              background: "rgba(255, 87, 51, 0.15)",
              border: "1px solid rgba(255, 87, 51, 0.4)",
              color: "#FF7A59",
              fontSize: "12px",
              fontWeight: "800",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertTriangleIcon size={16} color="#FF7A59" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {mode === "edit" && allUsers.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "5px" }}>
                SELECT USER ACCOUNT TO EDIT:
              </label>
              <SearchableSelect
                value={selectedUserId}
                onChange={(val) => handleUserSelectChange(Number(val))}
                options={allUsers.map((u) => ({
                  value: u.id,
                  label: u.name,
                  sublabel: u.role === "superadmin" ? "(Super Admin)" : u.partner_name ? `(Paired with ${u.partner_name})` : "(Solo / Unpaired)",
                }))}
                searchPlaceholder="Search account name or role..."
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "5px" }}>
              FULL NAME:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Charlie"
              required
              style={{
                width: "100%",
                background: "var(--bg-surface-input)",
                border: "1px solid var(--border-glass)",
                borderRadius: "14px",
                padding: "11px 14px",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: "700",
              }}
            />
          </div>

          {role !== "superadmin" && (
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "5px" }}>
                ACCOUNTABILITY PARTNER / DUO:
              </label>
              <SearchableSelect
                value={partnerId}
                onChange={(val) => setPartnerId(Number(val))}
                options={getPartnerOptions()}
                searchPlaceholder="Search accountability partner..."
              />
              <span style={{ display: "block", fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px" }}>
                The pair will share duo targets, head-to-head score tracking, and punishments.
              </span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "5px" }}>
                GENDER / AVATAR:
              </label>
              <SearchableSelect
                value={gender}
                onChange={(val) => setGender(val as "male" | "female")}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
                searchPlaceholder="Filter gender..."
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "5px" }}>
                ROLE:
              </label>
              <SearchableSelect
                value={selectedUserId === 1 ? "superadmin" : role}
                onChange={(val) => {
                  if (selectedUserId === 1) return;
                  setRole(val as "user" | "superadmin");
                }}
                disabled={selectedUserId === 1}
                options={
                  selectedUserId === 1
                    ? [{ value: "superadmin", label: "Super Admin (Locked Role)" }]
                    : [
                        { value: "user", label: "Regular Player" },
                        { value: "superadmin", label: "Super Admin" },
                      ]
                }
                searchPlaceholder="Filter role..."
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "5px" }}>
              PHONE / WHATSAPP:
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 6281234567890"
              style={{
                width: "100%",
                background: "var(--bg-surface-input)",
                border: "1px solid var(--border-glass)",
                borderRadius: "14px",
                padding: "11px 14px",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: "700",
              }}
            />
          </div>

          {mode === "edit" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255, 255, 255, 0.03)", padding: "10px 14px", borderRadius: "14px", border: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF" }}>Account Active Status</span>
              <button
                type="button"
                onClick={() => setActive(!active)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "900",
                  border: "none",
                  cursor: "pointer",
                  background: active ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 87, 51, 0.2)",
                  color: active ? "var(--emerald-glow)" : "#FF7A59",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {active ? (
                  <>
                    <CheckIcon size={12} color="var(--emerald-glow)" />
                    <span>ACTIVE</span>
                  </>
                ) : (
                  <>
                    <XIcon size={12} color="#FF7A59" />
                    <span>DISABLED</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", marginTop: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                <KeyIcon size={14} color="var(--emerald-primary)" />
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#FFFFFF" }}>
                  {mode === "register" ? "Set Account PIN (4 Digits)" : "Change Account PIN (4 Digits)"}
                </span>
              </div>
              <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                {mode === "register" ? "Required for sign in" : "Leave blank to keep existing"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  {mode === "register" ? "INITIAL PIN:" : "NEW PIN:"}
                </label>
                <input
                  type={showPins ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  required={mode === "register"}
                  style={{
                    width: "100%",
                    background: "var(--bg-surface-input)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: "900",
                    textAlign: "center",
                    letterSpacing: showPins ? "4px" : "8px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  CONFIRM PIN:
                </label>
                <input
                  type={showPins ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  required={mode === "register"}
                  style={{
                    width: "100%",
                    background: "var(--bg-surface-input)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: "900",
                    textAlign: "center",
                    letterSpacing: showPins ? "4px" : "8px",
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="checkbox"
                id="showPinToggle"
                checked={showPins}
                onChange={(e) => setShowPins(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <label htmlFor="showPinToggle" style={{ fontSize: "11px", color: "var(--text-secondary)", cursor: "pointer" }}>
                Show PIN digits
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="neo-btn neo-btn-emerald"
            style={{
              padding: "13px",
              marginTop: "10px",
              fontSize: "13px",
              fontWeight: "900",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <SpinnerIcon size={16} color="#FFFFFF" />
                <span>Saving...</span>
              </>
            ) : mode === "register" ? (
              <>
                <PlusIcon size={16} />
                <span>Create & Register Account</span>
              </>
            ) : (
              <>
                <ShieldIcon size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
