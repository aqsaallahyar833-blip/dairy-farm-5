import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
  FarmSettings,
  AppRole,
  AppUser,
  RolePermissionMatrix,
  ModulePermission,
  PermissionModule,
  PermissionAction,
  SystemFlags
} from "../types";
import {
  getSettings,
  saveSettings,
  getRoles,
  getUsers,
  getRolePermissions,
  getSystemFlags,
  updateSystemFlags,
  updateUser
} from "../api";
import { initialSettings, initialRoles, initialUsers, initialRolePermissions, initialSystemFlags } from "../data";
import { useToast } from "../components/Toast";

interface SettingsContextType {
  settings: FarmSettings;
  roles: AppRole[];
  users: AppUser[];
  activeUser: AppUser | null;
  activeRole: string;
  permissions: ModulePermission[];
  systemFlags: SystemFlags;
  currencySymbol: string;
  currencyCode: string;
  milkPricePerLitre: number;
  loading: boolean;
  hasPermission: (module: PermissionModule, action: PermissionAction) => boolean;
  refreshSettings: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  switchActiveUser: (userId: number) => Promise<void>;
  switchActiveRole: (roleName: string) => Promise<void>;
  saveFarmProfile: (profile: Partial<FarmSettings>) => Promise<void>;
  updateFlags: (flags: Partial<SystemFlags>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<FarmSettings>(initialSettings);
  const [roles, setRoles] = useState<AppRole[]>(initialRoles);
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [activeUser, setActiveUser] = useState<AppUser | null>(initialUsers[1] || initialUsers[0]);
  const [activeRole, setActiveRole] = useState<string>("Manager");
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMatrix[]>(initialRolePermissions);
  const [systemFlags, setSystemFlags] = useState<SystemFlags>(initialSystemFlags);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  const loadAll = useCallback(async () => {
    try {
      const [sData, rData, uData, pData, fData] = await Promise.all([
        getSettings().catch(() => initialSettings),
        getRoles().catch(() => initialRoles),
        getUsers().catch(() => initialUsers),
        getRolePermissions().catch(() => initialRolePermissions),
        getSystemFlags().catch(() => initialSystemFlags),
      ]);

      if (sData) setSettings(sData);
      if (Array.isArray(rData) && rData.length > 0) setRoles(rData);
      if (Array.isArray(uData) && uData.length > 0) {
        setUsers(uData);
        // default active user to manager or first user
        setActiveUser(prev => {
          if (!prev) return uData.find(u => u.roleName === "Manager") || uData[0];
          const found = uData.find(u => u.id === prev.id);
          return found || uData[0];
        });
      }
      if (Array.isArray(pData) && pData.length > 0) setRolePermissions(pData);
      if (fData) setSystemFlags(fData);
    } catch (err: any) {
      console.warn("Failed to load settings context:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Derived current permissions
  const currentPermissions = React.useMemo<ModulePermission[]>(() => {
    if (!activeUser) return [];
    const roleId = activeUser.roleId;
    const roleMatrix = rolePermissions.find(r => r.roleId === roleId || r.roleName.toLowerCase() === (activeUser.roleName || activeRole).toLowerCase());
    return roleMatrix?.permissions || [];
  }, [activeUser, activeRole, rolePermissions]);

  const hasPermission = useCallback((module: PermissionModule, action: PermissionAction): boolean => {
    // If auth/rbac is disabled via system flags, allow all
    if (!systemFlags.authRequired) return true;

    // Owner role has full access
    if (activeUser?.roleName === "Owner" || activeRole === "Owner") return true;

    const mod = currentPermissions.find(p => p.module === module);
    if (!mod) return true; // default open if not strictly defined

    switch (action) {
      case "View": return mod.canView;
      case "Create": return mod.canCreate;
      case "Edit": return mod.canEdit;
      case "Delete": return mod.canDelete;
      case "Export": return mod.canExport && systemFlags.enableDataExport;
      default: return true;
    }
  }, [currentPermissions, activeUser, activeRole, systemFlags]);

  const refreshSettings = async () => {
    const s = await getSettings();
    if (s) setSettings(s);
  };

  const refreshUsers = async () => {
    const u = await getUsers();
    if (Array.isArray(u)) setUsers(u);
  };

  const refreshRoles = async () => {
    const r = await getRoles();
    if (Array.isArray(r)) setRoles(r);
  };

  const refreshPermissions = async () => {
    const p = await getRolePermissions();
    if (Array.isArray(p)) setRolePermissions(p);
  };

  const switchActiveUser = async (userId: number) => {
    try {
      const resp = await fetch("/api/auth/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await resp.json();
      if (data.activeUser) {
        setActiveUser(data.activeUser);
        setActiveRole(data.activeRole || data.activeUser.roleName);
        showToast(`Switched user persona to ${data.activeUser.name} (${data.activeUser.roleName})`, "info");
      }
    } catch {
      const u = users.find(user => user.id === userId);
      if (u) {
        setActiveUser(u);
        setActiveRole(u.roleName);
        showToast(`Switched user persona to ${u.name} (${u.roleName})`, "info");
      }
    }
  };

  const switchActiveRole = async (roleName: string) => {
    try {
      const resp = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleName }),
      });
      const data = await resp.json();
      setActiveRole(data.role || roleName);
      if (activeUser) {
        setActiveUser({ ...activeUser, roleName: data.role || roleName });
      }
      showToast(`Active role set to ${roleName}`, "info");
    } catch {
      setActiveRole(roleName);
      if (activeUser) {
        setActiveUser({ ...activeUser, roleName });
      }
      showToast(`Active role set to ${roleName}`, "info");
    }
  };

  const saveFarmProfile = async (profile: Partial<FarmSettings>) => {
    const updated = { ...settings, ...profile };
    await saveSettings(updated);
    setSettings(updated);
  };

  const updateFlags = async (flags: Partial<SystemFlags>) => {
    const updated = { ...systemFlags, ...flags };
    await updateSystemFlags(updated);
    setSystemFlags(updated);
  };

  const value: SettingsContextType = {
    settings,
    roles,
    users,
    activeUser,
    activeRole,
    permissions: currentPermissions,
    systemFlags,
    currencySymbol: settings.currencySymbol || "Rs",
    currencyCode: settings.currency || "PKR",
    milkPricePerLitre: Number(settings.milkPricePerLitre) || 150,
    loading,
    hasPermission,
    refreshSettings,
    refreshUsers,
    refreshRoles,
    refreshPermissions,
    switchActiveUser,
    switchActiveRole,
    saveFarmProfile,
    updateFlags,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
