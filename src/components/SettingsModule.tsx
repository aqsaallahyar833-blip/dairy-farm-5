import React, { useState, useEffect, useMemo } from "react";
import {
  Settings,
  ShieldCheck,
  Users,
  Lock,
  FileText,
  Sliders,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Download,
  ArrowLeft,
  AlertTriangle,
  UserCheck,
  Key,
  Search,
  Check,
  X,
  Building2,
  DollarSign,
  Activity,
  Phone,
  Mail,
  MapPin,
  Clock,
  Briefcase,
  ShieldAlert,
  Info,
  UserPlus
} from "lucide-react";
import { useToast } from "./Toast";
import { useSettings } from "../context/SettingsContext";
import {
  AppRole,
  AppUser,
  RolePermissionMatrix,
  ModulePermission,
  AuditLogItem,
  SystemFlags,
  FarmSettings
} from "../types";
import {
  getRoles,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRolePermissions,
  updateRolePermissions,
  getAuditLogs,
  getSystemFlags,
  updateSystemFlags,
  saveSettings
} from "../api";
import { PERMISSION_MODULES } from "../data";

interface SettingsModuleProps {
  onNavigate?: (page: any) => void;
}

type TabType = "profile" | "rbac" | "users" | "flags" | "audit";

// Helper to format dates nicely (e.g. 01 Jan 2023)
function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "01 Jan 2023";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
}

// Role badge helper for CSS class
function getRoleBadgeClass(roleName?: string): string {
  const key = (roleName || "").toLowerCase().trim();
  if (key === "owner") return "role-badge owner";
  if (key === "manager") return "role-badge manager";
  if (key === "veterinarian") return "role-badge veterinarian";
  if (key === "feed manager") return "role-badge feed-manager";
  if (key === "worker") return "role-badge worker";
  if (key === "accountant") return "role-badge accountant";
  return "role-badge worker";
}

export function SettingsModule({ onNavigate }: SettingsModuleProps) {
  const {
    settings,
    refreshSettings,
    activeUser,
    activeRole,
    switchActiveUser
  } = useSettings();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [savingProfile, setSavingProfile] = useState(false);

  // --- TAB 1: PROFILE STATE ---
  const [farmName, setFarmName] = useState(settings.farmName || "Al-Barakah Dairy Farm Ltd.");
  const [companyName, setCompanyName] = useState(settings.companyName || "Al-Barakah Agri Group");
  const [currency, setCurrency] = useState(settings.currency || "PKR");
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || "Rs");
  const [milkPrice, setMilkPrice] = useState(String(settings.milkPricePerLitre || 150));
  const [managerName, setManagerName] = useState(settings.managerName || "Muhammad Ali");
  const [email, setEmail] = useState(settings.email || "admin@dairyfarm.local");
  const [phone, setPhone] = useState(settings.phone || "+92 300 1234567");
  const [address, setAddress] = useState(settings.address || "Chak 45-JB, Faisalabad Road");
  const [city, setCity] = useState(settings.city || "Sargodha, Pakistan");
  const [timezone, setTimezone] = useState(settings.timezone || "Asia/Karachi (UTC+5)");
  const [defaultMilkUnit, setDefaultMilkUnit] = useState(settings.defaultMilkUnit || "Litres");

  // --- TAB 2: RBAC MATRIX STATE ---
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(2); // Default to Manager
  const [permissionsMatrix, setPermissionsMatrix] = useState<RolePermissionMatrix[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // --- TAB 3: USER ACCOUNTS STATE ---
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("All");
  const [staffStatusFilter, setStaffStatusFilter] = useState("All");
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    phone: "",
    roleId: 2,
    status: "Active" as "Active" | "Inactive"
  });

  // --- TAB 4: SYSTEM FLAGS STATE ---
  const [flags, setFlags] = useState<SystemFlags>({
    auditLogging: true,
    authRequired: true,
    confirmBeforeDelete: true,
    recordUserActivity: true,
    enableDataExport: true,
    enableAuditHistory: true,
    milkWithdrawalSafety: true,
    pregnancyUltrasoundAlerts: true,
    autoBackups: true,
    duplicateEarTagValidation: true
  });
  const [updatingFlagKey, setUpdatingFlagKey] = useState<string | null>(null);

  // --- TAB 5: AUDIT LOGS STATE ---
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditModuleFilter, setAuditModuleFilter] = useState("All");
  const [auditActionFilter, setAuditActionFilter] = useState("All");
  const [auditLoading, setAuditLoading] = useState(false);

  // Load initial data
  const loadRolesAndPermissions = async () => {
    try {
      const [rData, pData] = await Promise.all([getRoles(), getRolePermissions()]);
      if (Array.isArray(rData) && rData.length > 0) {
        setRoles(rData);
        if (!rData.some((r) => r.id === selectedRoleId)) {
          setSelectedRoleId(rData[0].id);
        }
      }
      if (Array.isArray(pData) && pData.length > 0) {
        setPermissionsMatrix(pData);
      }
    } catch (err: any) {
      console.warn("Error loading RBAC:", err.message);
    }
  };

  const loadUsersList = async () => {
    try {
      const uData = await getUsers();
      if (Array.isArray(uData)) setUsersList(uData);
    } catch (err: any) {
      console.warn("Error loading users:", err.message);
    }
  };

  const loadFlags = async () => {
    try {
      const fData = await getSystemFlags();
      if (fData) setFlags(fData);
    } catch (err: any) {
      console.warn("Error loading flags:", err.message);
    }
  };

  const loadAuditLogsData = async () => {
    setAuditLoading(true);
    try {
      const logs = await getAuditLogs({
        module: auditModuleFilter !== "All" ? auditModuleFilter : undefined,
        action: auditActionFilter !== "All" ? auditActionFilter : undefined,
        search: auditSearch || undefined
      });
      if (Array.isArray(logs)) setAuditLogs(logs);
    } catch (err: any) {
      console.warn("Error loading audit logs:", err.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const [refreshingAll, setRefreshingAll] = useState(false);

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    try {
      await Promise.all([
        refreshSettings(),
        loadRolesAndPermissions(),
        loadUsersList(),
        loadFlags(),
        loadAuditLogsData()
      ]);
      showToast("Settings and security configuration refreshed from server", "success");
    } catch (err: any) {
      showToast(`Refresh error: ${err.message}`, "error");
    } finally {
      setRefreshingAll(false);
    }
  };

  useEffect(() => {
    loadRolesAndPermissions();
    loadUsersList();
    loadFlags();
  }, []);

  useEffect(() => {
    if (activeTab === "audit") {
      loadAuditLogsData();
    }
  }, [activeTab, auditModuleFilter, auditActionFilter]);

  // Sync settings when loaded from context
  useEffect(() => {
    if (settings) {
      if (settings.farmName) setFarmName(settings.farmName);
      if (settings.companyName) setCompanyName(settings.companyName);
      if (settings.currency) setCurrency(settings.currency);
      if (settings.currencySymbol) setCurrencySymbol(settings.currencySymbol);
      if (settings.milkPricePerLitre) setMilkPrice(String(settings.milkPricePerLitre));
      if (settings.managerName) setManagerName(settings.managerName);
      if (settings.email) setEmail(settings.email);
      if (settings.phone) setPhone(settings.phone);
      if (settings.address) setAddress(settings.address);
      if (settings.city) setCity(settings.city);
      if (settings.timezone) setTimezone(settings.timezone);
      if (settings.defaultMilkUnit) setDefaultMilkUnit(settings.defaultMilkUnit);
      if (settings.flags) setFlags((prev) => ({ ...prev, ...settings.flags }));
    }
  }, [settings]);

  // --- SAVE PROFILE HANDLER ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload: Partial<FarmSettings> = {
        farmName,
        companyName,
        currency,
        currencySymbol,
        milkPricePerLitre: Number(milkPrice) || 150,
        managerName,
        email,
        phone,
        address,
        city,
        timezone,
        defaultMilkUnit,
        flags
      };
      await saveSettings(payload);
      await refreshSettings();
      showToast("Farm Master Configuration saved successfully!", "success");
    } catch (err: any) {
      showToast(`Failed to save settings: ${err.message}`, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelProfile = () => {
    if (settings) {
      setFarmName(settings.farmName || "Al-Barakah Dairy Farm Ltd.");
      setCompanyName(settings.companyName || "Al-Barakah Agri Group");
      setCurrency(settings.currency || "PKR");
      setCurrencySymbol(settings.currencySymbol || "Rs");
      setMilkPrice(String(settings.milkPricePerLitre || 150));
      setManagerName(settings.managerName || "Muhammad Ali");
      setEmail(settings.email || "admin@dairyfarm.local");
      setPhone(settings.phone || "+92 300 1234567");
      setAddress(settings.address || "Chak 45-JB, Faisalabad Road");
      setCity(settings.city || "Sargodha, Pakistan");
      setTimezone(settings.timezone || "Asia/Karachi (UTC+5)");
      setDefaultMilkUnit(settings.defaultMilkUnit || "Litres");
    }
    showToast("Farm profile changes reverted.", "info");
  };

  // --- RBAC PERMISSIONS HANDLERS & CALCULATIONS ---
  const currentRoleObj = roles.find((r) => r.id === selectedRoleId) || roles[0];
  const currentRoleMatrix = permissionsMatrix.find((p) => p.roleId === selectedRoleId) || {
    roleId: selectedRoleId,
    roleName: currentRoleObj?.name || "Manager",
    permissions: PERMISSION_MODULES.map((m) => ({
      module: m,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canExport: true
    }))
  };

  // Real-time access summary metrics
  const rbacSummary = useMemo(() => {
    const perms = currentRoleMatrix.permissions || [];
    let enabledModulesCount = 0;
    let totalEnabledPermissions = 0;

    perms.forEach((p) => {
      let modActive = false;
      if (p.canView) {
        totalEnabledPermissions++;
        modActive = true;
      }
      if (p.canCreate) {
        totalEnabledPermissions++;
        modActive = true;
      }
      if (p.canEdit) {
        totalEnabledPermissions++;
        modActive = true;
      }
      if (p.canDelete) {
        totalEnabledPermissions++;
        modActive = true;
      }
      if (p.canExport) {
        totalEnabledPermissions++;
        modActive = true;
      }

      if (modActive) {
        enabledModulesCount++;
      }
    });

    return {
      enabledModules: enabledModulesCount,
      totalPermissions: totalEnabledPermissions
    };
  }, [currentRoleMatrix]);

  const handlePermissionToggle = (
    moduleName: string,
    action: "canView" | "canCreate" | "canEdit" | "canDelete" | "canExport"
  ) => {
    setPermissionsMatrix((prev) => {
      const next = [...prev];
      let roleIdx = next.findIndex((p) => p.roleId === selectedRoleId);
      if (roleIdx === -1) {
        next.push({
          roleId: selectedRoleId,
          roleName: currentRoleObj?.name || "Role",
          permissions: PERMISSION_MODULES.map((m) => ({
            module: m,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: false,
            canExport: true
          }))
        });
        roleIdx = next.length - 1;
      }

      const rolePerms = { ...next[roleIdx] };
      const modPerms = [...rolePerms.permissions];
      const modIdx = modPerms.findIndex((p) => p.module === moduleName);

      if (modIdx !== -1) {
        modPerms[modIdx] = {
          ...modPerms[modIdx],
          [action]: !modPerms[modIdx][action]
        };
      } else {
        modPerms.push({
          module: moduleName,
          canView: action === "canView",
          canCreate: action === "canCreate",
          canEdit: action === "canEdit",
          canDelete: action === "canDelete",
          canExport: action === "canExport"
        });
      }

      rolePerms.permissions = modPerms;
      next[roleIdx] = rolePerms;
      return next;
    });
  };

  const handleToggleAllColumn = (
    action: "canView" | "canCreate" | "canEdit" | "canDelete" | "canExport",
    forceValue?: boolean
  ) => {
    setPermissionsMatrix((prev) => {
      const next = [...prev];
      let roleIdx = next.findIndex((p) => p.roleId === selectedRoleId);
      if (roleIdx === -1) return prev;

      const rolePerms = { ...next[roleIdx] };
      const allChecked =
        forceValue !== undefined
          ? !forceValue
          : rolePerms.permissions.every((p) => p[action]);
      const targetState = !allChecked;

      rolePerms.permissions = rolePerms.permissions.map((p) => ({
        ...p,
        [action]: targetState
      }));

      next[roleIdx] = rolePerms;
      return next;
    });
  };

  const handleToggleRow = (moduleName: string) => {
    setPermissionsMatrix((prev) => {
      const next = [...prev];
      let roleIdx = next.findIndex((p) => p.roleId === selectedRoleId);
      if (roleIdx === -1) return prev;

      const rolePerms = { ...next[roleIdx] };
      const modPerms = [...rolePerms.permissions];
      const modIdx = modPerms.findIndex((p) => p.module === moduleName);
      if (modIdx === -1) return prev;

      const current = modPerms[modIdx];
      const allActive =
        current.canView &&
        current.canCreate &&
        current.canEdit &&
        current.canDelete &&
        current.canExport;
      const targetState = !allActive;

      modPerms[modIdx] = {
        module: moduleName,
        canView: targetState,
        canCreate: targetState,
        canEdit: targetState,
        canDelete: targetState,
        canExport: targetState
      };

      rolePerms.permissions = modPerms;
      next[roleIdx] = rolePerms;
      return next;
    });
  };

  const handleSaveRolePermissions = async () => {
    setSavingPermissions(true);
    try {
      await updateRolePermissions(selectedRoleId, currentRoleMatrix.permissions);
      showToast(`Permissions updated for role: ${currentRoleObj?.name}`, "success");
    } catch (err: any) {
      showToast(`Failed to update permissions: ${err.message}`, "error");
    } finally {
      setSavingPermissions(false);
    }
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleOpenUserModal = (user?: AppUser) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        roleId: user.roleId,
        status: user.status
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        name: "",
        email: "",
        phone: "",
        roleId: roles[0]?.id || 2,
        status: "Active"
      });
    }
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.email.trim()) {
      showToast("Please provide user name and email", "error");
      return;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, userFormData);
        showToast(`User ${userFormData.name} updated successfully`, "success");
      } else {
        await createUser(userFormData);
        showToast(`User ${userFormData.name} added successfully`, "success");
      }
      setUserModalOpen(false);
      await loadUsersList();
    } catch (err: any) {
      showToast(`Failed to save user: ${err.message}`, "error");
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (window.confirm(`Are you sure you want to remove staff user: ${user.name}?`)) {
      try {
        await deleteUser(user.id);
        showToast(`User ${user.name} removed successfully`, "info");
        await loadUsersList();
      } catch (err: any) {
        showToast(`Failed to delete user: ${err.message}`, "error");
      }
    }
  };

  // Filtered staff list
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchSearch =
        staffSearchQuery === "" ||
        u.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        u.roleName.toLowerCase().includes(staffSearchQuery.toLowerCase());

      const matchRole =
        staffRoleFilter === "All" ||
        u.roleName.toLowerCase() === staffRoleFilter.toLowerCase() ||
        String(u.roleId) === staffRoleFilter;

      const matchStatus =
        staffStatusFilter === "All" || u.status === staffStatusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [usersList, staffSearchQuery, staffRoleFilter, staffStatusFilter]);

  // Selected role for modal helper
  const formSelectedRole = roles.find((r) => r.id === userFormData.roleId);

  // --- SYSTEM FLAGS TOGGLE HANDLER ---
  const handleToggleFlag = async (key: keyof SystemFlags) => {
    setUpdatingFlagKey(key);
    const updated = { ...flags, [key]: !flags[key] };
    setFlags(updated);

    try {
      await updateSystemFlags(updated);
      showToast(`${key} is now ${updated[key] ? "Enabled" : "Disabled"}`, "info");
    } catch (err: any) {
      setFlags(flags);
      showToast(`Failed to update system flag: ${err.message}`, "error");
    } finally {
      setUpdatingFlagKey(null);
    }
  };

  // --- AUDIT LOGS CSV EXPORT ---
  const handleExportAuditCSV = () => {
    if (auditLogs.length === 0) {
      showToast("No audit records to export", "info");
      return;
    }

    const headers = [
      "ID",
      "Timestamp",
      "User ID",
      "User Name",
      "User Role",
      "Action",
      "Module",
      "Record ID",
      "Details",
      "IP Address"
    ];
    const rows = auditLogs.map((l) => [
      l.id,
      l.timestamp,
      l.userId,
      `"${(l.userName || "").replace(/"/g, '""')}"`,
      `"${(l.userRole || "").replace(/"/g, '""')}"`,
      l.action,
      l.module,
      l.recordId || "",
      `"${(l.details || "").replace(/"/g, '""')}"`,
      l.ipAddress || ""
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `farm_audit_trail_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Audit trail exported to CSV", "success");
  };

  return (
    <div className="content settings-page" id="settings-page">
      {/* ========================================================================= */}
      {/* 1. CLEAN TOP HEADER */}
      {/* ========================================================================= */}
      <div className="page-title module-page-header settings-header" id="settings-header">
        <div>
          <h2 className="module-page-title settings-title">System Configuration &amp; Farm Settings</h2>
          <p className="module-page-subtitle settings-subtitle">
            Manage farm information, users, permissions, and system security
          </p>
        </div>

        <div className="actions module-header-actions settings-actions">
          <button
            type="button"
            className="secondary"
            id="btn-return-dashboard-settings"
            onClick={() => (onNavigate ? onNavigate("Dashboard") : (window.location.hash = "#Dashboard"))}
            title="Return to Main Dashboard"
          >
            <ArrowLeft size={15} />
            <span>Return to Dashboard</span>
          </button>

          <button
            type="button"
            className="secondary"
            id="btn-refresh-settings-all"
            onClick={handleRefreshAll}
            disabled={refreshingAll}
            title="Reload settings and security data from database"
          >
            <RefreshCw size={15} className={refreshingAll ? "spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="primary"
            id="btn-add-staff-top"
            onClick={() => {
              setActiveTab("users");
              handleOpenUserModal();
            }}
            title="Add a new staff member account"
          >
            <Plus size={16} />
            <span>+ Add Staff User</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FIVE CLEAN NAVIGATION CARDS/TABS STRIP */}
      {/* ========================================================================= */}
      <div className="settings-nav-grid" id="settings-nav-grid" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "profile"}
          className={`settings-nav-card ${activeTab === "profile" ? "active" : ""}`}
          id="nav-tab-profile"
          onClick={() => setActiveTab("profile")}
        >
          <div className="settings-nav-icon">
            <Building2 size={16} />
          </div>
          <span className="settings-nav-title">Farm Master</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "rbac"}
          className={`settings-nav-card ${activeTab === "rbac" ? "active" : ""}`}
          id="nav-tab-rbac"
          onClick={() => setActiveTab("rbac")}
        >
          <div className="settings-nav-icon">
            <Lock size={16} />
          </div>
          <span className="settings-nav-title">RBAC Permissions</span>
          <span className="settings-nav-badge">{roles.length || 6}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "users"}
          className={`settings-nav-card ${activeTab === "users" ? "active" : ""}`}
          id="nav-tab-users"
          onClick={() => setActiveTab("users")}
        >
          <div className="settings-nav-icon">
            <Users size={16} />
          </div>
          <span className="settings-nav-title">Staff Accounts</span>
          <span className="settings-nav-badge">{usersList.length || 6}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "flags"}
          className={`settings-nav-card ${activeTab === "flags" ? "active" : ""}`}
          id="nav-tab-flags"
          onClick={() => setActiveTab("flags")}
        >
          <div className="settings-nav-icon">
            <ShieldCheck size={16} />
          </div>
          <span className="settings-nav-title">System Flags</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "audit"}
          className={`settings-nav-card ${activeTab === "audit" ? "active" : ""}`}
          id="nav-tab-audit"
          onClick={() => setActiveTab("audit")}
        >
          <div className="settings-nav-icon">
            <FileText size={16} />
          </div>
          <span className="settings-nav-title">Audit Trail</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: FARM MASTER PROFILE */}
      {/* ========================================================================= */}
      {activeTab === "profile" && (
        <div className="card settings-section-card" id="farm-profile-section">
          <div className="settings-section-header">
            <div>
              <h2>Farm Profile</h2>
              <p>Configure organization parameters, financial valuation standards, and management contact</p>
            </div>
            <span className="status-badge active" id="farm-profile-active-badge">
              Active Master Profile
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="settings-section-body" id="form-farm-profile">
            <div className="settings-form-grid" id="farm-profile-grid">
              {/* Row 1: Farm Name * | Registered Enterprise */}
              <div className="settings-form-group">
                <label htmlFor="input-farm-name">
                  Farm Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="input-farm-name"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  required
                  placeholder="e.g. Al-Barakah Dairy Farm Ltd."
                  className="settings-input"
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="input-company-name">Registered Enterprise</label>
                <input
                  type="text"
                  id="input-company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Al-Barakah Agri Group"
                  className="settings-input"
                />
              </div>

              {/* Row 2: Currency Code (ISO) | Currency Symbol */}
              <div className="settings-form-group">
                <label htmlFor="input-currency-code">Currency Code (ISO)</label>
                <input
                  type="text"
                  id="input-currency-code"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  placeholder="PKR, USD"
                  className="settings-input"
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="input-currency-symbol">Currency Symbol</label>
                <input
                  type="text"
                  id="input-currency-symbol"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="Rs, $, €"
                  className="settings-input"
                />
              </div>

              {/* Row 3: Default Base Milk Price / L | Farm Manager */}
              <div className="settings-form-group">
                <label htmlFor="input-milk-price">Default Base Milk Price / L</label>
                <input
                  type="number"
                  id="input-milk-price"
                  value={milkPrice}
                  onChange={(e) => setMilkPrice(e.target.value)}
                  step="0.5"
                  min="0"
                  placeholder="150"
                  className="settings-input"
                  style={{ color: "var(--primary-dark)", fontWeight: 700 }}
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="select-farm-manager">Farm Manager</label>
                <select
                  id="select-farm-manager"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="settings-select"
                >
                  {usersList.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.roleName})
                    </option>
                  ))}
                  {!usersList.some((u) => u.name === managerName) && (
                    <option value={managerName}>{managerName} (Custom)</option>
                  )}
                </select>
              </div>

              {/* Row 4: Unit of Milk Measurement | Operating Timezone */}
              <div className="settings-form-group">
                <label htmlFor="select-milk-unit">Unit of Milk Measurement</label>
                <select
                  id="select-milk-unit"
                  value={defaultMilkUnit}
                  onChange={(e) => setDefaultMilkUnit(e.target.value)}
                  className="settings-select"
                >
                  <option value="Litres">Litres (L)</option>
                  <option value="Kilograms">Kilograms (kg)</option>
                  <option value="Gallons">Gallons (US)</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label htmlFor="input-farm-timezone">Operating Timezone</label>
                <input
                  type="text"
                  id="input-farm-timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Asia/Karachi (UTC+5)"
                  className="settings-input"
                />
              </div>

              {/* Row 5: Contact Email Address | Phone / WhatsApp */}
              <div className="settings-form-group">
                <label htmlFor="input-farm-email">Contact Email Address</label>
                <input
                  type="email"
                  id="input-farm-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dairyfarm.local"
                  className="settings-input"
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="input-farm-phone">Phone / WhatsApp</label>
                <input
                  type="text"
                  id="input-farm-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="settings-input"
                />
              </div>

              {/* Row 6: Physical Farm Address (Full Width) */}
              <div className="settings-form-group full-width">
                <label htmlFor="input-farm-address">Physical Farm Address</label>
                <textarea
                  id="input-farm-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Chak 45-JB, Faisalabad Road, Sargodha, Pakistan"
                  className="settings-textarea"
                />
              </div>
            </div>

            {/* Row 7: Actions Area */}
            <div className="settings-form-actions" id="farm-profile-actions">
              <button
                type="button"
                onClick={handleCancelProfile}
                className="secondary"
                id="btn-cancel-farm-profile"
                disabled={savingProfile}
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-farm-profile"
                disabled={savingProfile}
                className="primary"
              >
                <Save size={15} />
                <span>{savingProfile ? "Saving Profile..." : "Save Profile"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: RBAC PERMISSIONS MATRIX */}
      {/* ========================================================================= */}
      {activeTab === "rbac" && (
        <div className="settings-section-card" id="5x2hsb">
          <div className="settings-section-header">
            <div>
              <h2>Role Permissions Matrix (RBAC)</h2>
              <p>Configure granular module access, create, edit, delete, and export permissions by role</p>
            </div>
            <button
              type="button"
              onClick={handleSaveRolePermissions}
              disabled={savingPermissions}
              className="btn-primary"
              id="btn-save-role-permissions-top"
            >
              <Save size={16} />
              <span>{savingPermissions ? "Saving..." : "Save Permissions"}</span>
            </button>
          </div>

          <div className="settings-section-body" style={{ paddingBottom: "16px" }}>
            {/* Role Select Bar */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                Select Role:
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }} id="role-selector-pills">
                {roles.map((r) => {
                  const isSelected = selectedRoleId === r.id;
                  const staffCount = usersList.filter(
                    (u) => u.roleId === r.id || u.roleName.toLowerCase() === r.name.toLowerCase()
                  ).length;

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRoleId(r.id)}
                      className={isSelected ? "btn-primary" : "btn-secondary"}
                      style={{ height: "36px", padding: "0 14px", fontSize: "12px" }}
                      id={`btn-select-role-${r.id}`}
                    >
                      <Lock size={13} />
                      <span>{r.name}</span>
                      <span
                        style={{
                          marginLeft: "4px",
                          padding: "1px 6px",
                          borderRadius: "10px",
                          fontSize: "10px",
                          background: isSelected ? "rgba(0,0,0,0.15)" : "#e5e7eb",
                          color: isSelected ? "#fff" : "#4b5563"
                        }}
                      >
                        {staffCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Role Summary Panel */}
            <div className="settings-info-panel" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div className="settings-info-panel-title">
                    <Key size={14} className="text-emerald-600" />
                    Selected Role: <strong>{currentRoleObj?.name}</strong>
                  </div>
                  <p className="settings-info-panel-text">
                    {currentRoleObj?.description || "Role permissions govern access to herd records, milking logs, medications, and financial reporting."}
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--primary-dark)", background: "var(--primary-soft)", padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--primary-border)" }}>
                    Access Profile: {rbacSummary.enabledModules} Modules · {rbacSummary.totalPermissions} Permissions Enabled
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="settings-table-wrapper">
            <table className="settings-table" id="rbac-matrix-table">
              <thead style={{ position: "sticky", top: 0, zIndex: 5 }}>
                <tr>
                  <th style={{ width: "30%" }}>Module</th>
                  <th style={{ textAlign: "center", width: "14%" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <span>View</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAllColumn("canView")}
                        style={{ fontSize: "10px", color: "var(--primary)", textDecoration: "underline" }}
                      >
                        Toggle All
                      </button>
                    </div>
                  </th>
                  <th style={{ textAlign: "center", width: "14%" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <span>Create</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAllColumn("canCreate")}
                        style={{ fontSize: "10px", color: "var(--primary)", textDecoration: "underline" }}
                      >
                        Toggle All
                      </button>
                    </div>
                  </th>
                  <th style={{ textAlign: "center", width: "14%" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <span>Edit</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAllColumn("canEdit")}
                        style={{ fontSize: "10px", color: "var(--primary)", textDecoration: "underline" }}
                      >
                        Toggle All
                      </button>
                    </div>
                  </th>
                  <th style={{ textAlign: "center", width: "14%" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <span>Delete</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAllColumn("canDelete")}
                        style={{ fontSize: "10px", color: "var(--primary)", textDecoration: "underline" }}
                      >
                        Toggle All
                      </button>
                    </div>
                  </th>
                  <th style={{ textAlign: "center", width: "14%" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <span>Export</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAllColumn("canExport")}
                        style={{ fontSize: "10px", color: "var(--primary)", textDecoration: "underline" }}
                      >
                        Toggle All
                      </button>
                    </div>
                  </th>
                  <th style={{ textAlign: "center", width: "10%" }}>Row Actions</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MODULES.map((moduleName) => {
                  const modPerm = currentRoleMatrix.permissions?.find(
                    (p) => p.module === moduleName
                  ) || {
                    module: moduleName,
                    canView: false,
                    canCreate: false,
                    canEdit: false,
                    canDelete: false,
                    canExport: false
                  };

                  return (
                    <tr key={moduleName}>
                      <td style={{ fontWeight: 600, color: "var(--ink)" }}>{moduleName}</td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={modPerm.canView}
                          onChange={() => handlePermissionToggle(moduleName, "canView")}
                          style={{ width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer" }}
                          title={`Toggle View for ${moduleName}`}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={modPerm.canCreate}
                          onChange={() => handlePermissionToggle(moduleName, "canCreate")}
                          style={{ width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer" }}
                          title={`Toggle Create for ${moduleName}`}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={modPerm.canEdit}
                          onChange={() => handlePermissionToggle(moduleName, "canEdit")}
                          style={{ width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer" }}
                          title={`Toggle Edit for ${moduleName}`}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={modPerm.canDelete}
                          onChange={() => handlePermissionToggle(moduleName, "canDelete")}
                          style={{ width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer" }}
                          title={`Toggle Delete for ${moduleName}`}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={modPerm.canExport}
                          onChange={() => handlePermissionToggle(moduleName, "canExport")}
                          style={{ width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer" }}
                          title={`Toggle Export for ${moduleName}`}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleRow(moduleName)}
                          className="btn-secondary"
                          style={{ height: "26px", padding: "0 8px", fontSize: "10px" }}
                        >
                          Toggle Row
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "16px 24px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid #edf2ef" }}>
            <button
              type="button"
              onClick={handleSaveRolePermissions}
              disabled={savingPermissions}
              className="btn-primary"
              id="btn-save-role-permissions-bottom"
            >
              <Save size={16} />
              <span>{savingPermissions ? "Saving..." : "Save Permissions"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: REGISTERED FARM STAFF ACCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="settings-section-card" id="o7nt8r">
          <div className="settings-section-header">
            <div>
              <h2>Registered Farm Staff Accounts</h2>
              <p>Manage user credentials, contact details, assigned system roles, and active personas</p>
            </div>
            <button
              type="button"
              className="btn-primary"
              id="btn-add-user-section"
              onClick={() => handleOpenUserModal()}
            >
              <Plus size={16} />
              <span>+ Add New User</span>
            </button>
          </div>

          {/* Compact Toolbar */}
          <div className="settings-toolbar" id="t3b1nz">
            <div className="settings-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search staff..."
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                id="input-search-staff"
              />
            </div>

            <div className="settings-filter-group">
              <select
                className="settings-select"
                value={staffRoleFilter}
                onChange={(e) => setStaffRoleFilter(e.target.value)}
                id="select-filter-role"
              >
                <option value="All">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>

              <select
                className="settings-select"
                value={staffStatusFilter}
                onChange={(e) => setStaffStatusFilter(e.target.value)}
                id="select-filter-status"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              {(staffSearchQuery || staffRoleFilter !== "All" || staffStatusFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setStaffSearchQuery("");
                    setStaffRoleFilter("All");
                    setStaffStatusFilter("All");
                  }}
                  className="btn-secondary"
                  style={{ height: "38px", padding: "0 10px", fontSize: "11px" }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Staff Accounts Table */}
          <div className="settings-table-wrapper">
            <table className="settings-table" id="staff-accounts-table">
              <thead>
                <tr>
                  <th style={{ width: "28%" }}>Staff Member</th>
                  <th style={{ width: "16%" }}>Role</th>
                  <th style={{ width: "24%" }}>Contact</th>
                  <th style={{ width: "12%" }}>Status</th>
                  <th style={{ width: "10%" }}>Session</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "36px 16px", color: "var(--muted)" }}>
                      No staff accounts found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const initials = user.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "U";
                    const isCurrentUser =
                      activeUser?.id === user.id || activeUser?.email === user.email;

                    return (
                      <tr key={user.id} id={`staff-row-${user.id}`}>
                        {/* 6. Staff Member Cell */}
                        <td>
                          <div className="staff-member-cell" id="qxj2g7">
                            <div className="staff-avatar-circle" id="2wxm08">
                              {initials}
                            </div>
                            <div>
                              <div className="staff-name-title">{user.name}</div>
                              <div className="staff-secondary-info">
                                ID #{user.id} · Registered {formatDisplayDate(user.createdAt)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 8. Role Badge */}
                        <td>
                          <span className={getRoleBadgeClass(user.roleName)} id="t3zmbc">
                            {user.roleName}
                          </span>
                        </td>

                        {/* Contact Details */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "12px", color: "var(--ink)", display: "flex", alignItems: "center", gap: "5px" }}>
                              <Mail size={12} className="text-gray-400" />
                              {user.email}
                            </span>
                            {user.phone && (
                              <span style={{ fontSize: "11px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                                <Phone size={11} className="text-gray-400" />
                                {user.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 9. Status Badge */}
                        <td>
                          <span className={`status-badge ${user.status === "Active" ? "active" : "inactive"}`} id="w4z94t">
                            {user.status === "Active" ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* 10. Session / Active Persona */}
                        <td>
                          {isCurrentUser ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "10.5px",
                                fontWeight: 600,
                                background: "var(--primary-soft)",
                                color: "var(--primary-dark)",
                                border: "1px solid var(--primary-border)"
                              }}
                            >
                              <CheckCircle2 size={11} />
                              Active Session
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                switchActiveUser(user);
                                showToast(`Switched active session to ${user.name} (${user.roleName})`, "info");
                              }}
                              className="btn-secondary"
                              style={{ height: "26px", padding: "0 8px", fontSize: "10.5px" }}
                              id="ro2cnl"
                              title="Switch live persona to this user"
                            >
                              Switch Persona
                            </button>
                          )}
                        </td>

                        {/* 11. Actions Area */}
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }} id="s5azkq">
                            <button
                              type="button"
                              className="btn-icon-subtle"
                              onClick={() => handleOpenUserModal(user)}
                              title={`Edit ${user.name}`}
                              aria-label={`Edit ${user.name}`}
                              id={`btn-edit-user-${user.id}`}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon-subtle delete"
                              onClick={() => handleDeleteUser(user)}
                              title={`Remove ${user.name}`}
                              aria-label={`Remove ${user.name}`}
                              id={`btn-delete-user-${user.id}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: SYSTEM FLAGS & COMPLIANCE */}
      {/* ========================================================================= */}
      {activeTab === "flags" && (
        <div className="settings-section-card" id="rhsh88">
          <div className="settings-section-header">
            <div>
              <h2>System Security &amp; Compliance Flags</h2>
              <p>Runtime governance toggles for audit logging, RBAC validation, safety alerts, and automated backups</p>
            </div>
            <span className="status-badge active">System Governance Active</span>
          </div>

          <div className="settings-section-body" style={{ padding: 0 }}>
            {/* Setting Row 1 */}
            <div className="settings-flag-row">
              <div className="settings-flag-info">
                <h4>Audit Logging</h4>
                <p>Record tamper-evident security logs for every record creation, modification, and deletion.</p>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${flags.auditLogging ? "on" : "off"}`}
                onClick={() => handleToggleFlag("auditLogging")}
                disabled={updatingFlagKey === "auditLogging"}
              >
                {flags.auditLogging ? "ON" : "OFF"}
              </button>
            </div>

            {/* Setting Row 2 */}
            <div className="settings-flag-row">
              <div className="settings-flag-info">
                <h4>Authentication Required</h4>
                <p>Enforce strict role-based access validation before permitting view or modification of records.</p>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${flags.authRequired ? "on" : "off"}`}
                onClick={() => handleToggleFlag("authRequired")}
                disabled={updatingFlagKey === "authRequired"}
              >
                {flags.authRequired ? "ON" : "OFF"}
              </button>
            </div>

            {/* Setting Row 3 */}
            <div className="settings-flag-row">
              <div className="settings-flag-info">
                <h4>Delete Confirmation</h4>
                <p>Require explicit confirmation prompts before destructive removals of animals, tasks, or ledger items.</p>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${flags.confirmBeforeDelete ? "on" : "off"}`}
                onClick={() => handleToggleFlag("confirmBeforeDelete")}
                disabled={updatingFlagKey === "confirmBeforeDelete"}
              >
                {flags.confirmBeforeDelete ? "ON" : "OFF"}
              </button>
            </div>

            {/* Setting Row 4 */}
            <div className="settings-flag-row">
              <div className="settings-flag-info">
                <h4>Activity Tracking</h4>
                <p>Capture active operator identity, timestamp, and IP addresses across all database transactions.</p>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${flags.recordUserActivity ? "on" : "off"}`}
                onClick={() => handleToggleFlag("recordUserActivity")}
                disabled={updatingFlagKey === "recordUserActivity"}
              >
                {flags.recordUserActivity ? "ON" : "OFF"}
              </button>
            </div>

            {/* Setting Row 5 */}
            <div className="settings-flag-row">
              <div className="settings-flag-info">
                <h4>Data Export</h4>
                <p>Permit authorized operators to export animal histories, milk yields, and audit logs to CSV.</p>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${flags.enableDataExport ? "on" : "off"}`}
                onClick={() => handleToggleFlag("enableDataExport")}
                disabled={updatingFlagKey === "enableDataExport"}
              >
                {flags.enableDataExport ? "ON" : "OFF"}
              </button>
            </div>

            {/* Setting Row 6 */}
            <div className="settings-flag-row">
              <div className="settings-flag-info">
                <h4>Milk Withdrawal Safety Lock</h4>
                <p>Block active milking entries for cows currently undergoing medication withdrawal periods.</p>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${flags.milkWithdrawalSafety ? "on" : "off"}`}
                onClick={() => handleToggleFlag("milkWithdrawalSafety")}
                disabled={updatingFlagKey === "milkWithdrawalSafety"}
              >
                {flags.milkWithdrawalSafety ? "ON" : "OFF"}
              </button>
            </div>

            {/* Setting Row 7 */}
            <div className="settings-flag-row">
              <div className="settings-flag-info">
                <h4>Duplicate Ear Tag Validation</h4>
                <p>Strictly prevent registration of multiple active cattle with identical farm ear tag identifiers.</p>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${flags.duplicateEarTagValidation ? "on" : "off"}`}
                onClick={() => handleToggleFlag("duplicateEarTagValidation")}
                disabled={updatingFlagKey === "duplicateEarTagValidation"}
              >
                {flags.duplicateEarTagValidation ? "ON" : "OFF"}
              </button>
            </div>

            {/* Setting Row 8 */}
            <div className="settings-flag-row">
              <div className="settings-flag-info">
                <h4>Automated Daily Backups</h4>
                <p>Automatically create periodic snapshots of farm records and database tables.</p>
              </div>
              <button
                type="button"
                className={`toggle-switch-btn ${flags.autoBackups ? "on" : "off"}`}
                onClick={() => handleToggleFlag("autoBackups")}
                disabled={updatingFlagKey === "autoBackups"}
              >
                {flags.autoBackups ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === "audit" && (
        <div className="settings-section-card" id="w6y7q0">
          <div className="settings-section-header">
            <div>
              <h2>Audit Trail &amp; Activity Log</h2>
              <p>Real-time log of system modifications, user logins, and administrative changes</p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={loadAuditLogsData}
                className="btn-secondary"
                disabled={auditLoading}
                title="Refresh audit log entries"
              >
                <RefreshCw size={14} className={auditLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={handleExportAuditCSV}
                className="btn-secondary"
                title="Download CSV report"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Audit Toolbar */}
          <div className="settings-toolbar">
            <div className="settings-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search activity..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadAuditLogsData()}
              />
            </div>

            <div className="settings-filter-group">
              <select
                className="settings-select"
                value={auditModuleFilter}
                onChange={(e) => setAuditModuleFilter(e.target.value)}
              >
                <option value="All">All Modules</option>
                {PERMISSION_MODULES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                className="settings-select"
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
              >
                <option value="All">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="LOGIN">LOGIN</option>
                <option value="SETTINGS_CHANGE">SETTINGS_CHANGE</option>
              </select>
            </div>
          </div>

          {/* Audit Table */}
          <div className="settings-table-wrapper">
            <table className="settings-table">
              <thead>
                <tr>
                  <th style={{ width: "16%" }}>Timestamp</th>
                  <th style={{ width: "18%" }}>User &amp; Role</th>
                  <th style={{ width: "12%" }}>Action</th>
                  <th style={{ width: "14%" }}>Module</th>
                  <th style={{ width: "30%" }}>Activity Details</th>
                  <th style={{ width: "10%", textAlign: "right" }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "36px 16px", color: "var(--muted)" }}>
                      Loading audit records...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "36px 16px", color: "var(--muted)" }}>
                      No audit log records found for the current query.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const timeStr = log.timestamp
                      ? new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "08:00 AM";
                    const dateStr = formatDisplayDate(log.timestamp);

                    return (
                      <tr key={log.id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--ink)" }}>{timeStr}</div>
                            <div style={{ fontSize: "11px", color: "var(--muted)" }}>{dateStr}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--ink)" }}>{log.userName || "System"}</div>
                            <span className={getRoleBadgeClass(log.userRole)} style={{ marginTop: "2px" }}>
                              {log.userRole || "System"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              fontSize: "10.5px",
                              fontWeight: 700,
                              background:
                                log.action === "DELETE"
                                  ? "#fef2f2"
                                  : log.action === "CREATE"
                                  ? "#f0fdf4"
                                  : "#f8fafc",
                              color:
                                log.action === "DELETE"
                                  ? "#dc2626"
                                  : log.action === "CREATE"
                                  ? "#16a34a"
                                  : "#475569",
                              border:
                                log.action === "DELETE"
                                  ? "1px solid #fecaca"
                                  : log.action === "CREATE"
                                  ? "1px solid #bbf7d0"
                                  : "1px solid #e2e8f0"
                            }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{log.module}</td>
                        <td style={{ color: "var(--ink)", lineHeight: 1.4 }}>
                          {log.details}
                          {log.recordId && (
                            <span style={{ marginLeft: "6px", fontSize: "10.5px", color: "var(--muted)" }}>
                              (ID: {log.recordId})
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "11px", color: "var(--muted)" }}>
                          {log.ipAddress || "127.0.0.1"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12 & 13. ADD / EDIT STAFF USER MODAL */}
      {/* ========================================================================= */}
      {userModalOpen && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px"
          }}
          id="k88v0j"
        >
          <div
            className="settings-section-card"
            style={{
              width: "100%",
              maxWidth: "580px",
              backgroundColor: "#fff",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              margin: 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-section-header">
              <div>
                <h2>{editingUser ? "Edit Staff User Account" : "Add New Staff Account"}</h2>
                <p>Configure personal details, system credentials, and assigned role</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const isDirty = userFormData.name.trim() !== "" || userFormData.email.trim() !== "";
                  if (isDirty && !window.confirm("Discard unsaved changes? Any entered information will be lost.")) {
                    return;
                  }
                  setUserModalOpen(false);
                }}
                className="btn-icon-subtle"
                title="Close modal"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="settings-section-body" style={{ padding: "20px 24px" }}>
              {/* Group 1: Personal Information */}
              <div style={{ marginBottom: "20px" }} id="loy2qe">
                <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "12px" }}>
                  Personal Information
                </h3>
                <div className="settings-form-grid" id="0d5e0o">
                  <div className="settings-form-group">
                    <label htmlFor="modal-input-name">
                      Full Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="modal-input-name"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                      required
                      placeholder="e.g. Dr. Imran Aslam"
                      className="settings-input"
                    />
                  </div>

                  <div className="settings-form-group">
                    <label htmlFor="modal-input-email">
                      Email Address <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="modal-input-email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      required
                      placeholder="user@dairyfarm.local"
                      className="settings-input"
                    />
                  </div>

                  <div className="settings-form-group full-width">
                    <label htmlFor="modal-input-phone">Phone Number</label>
                    <input
                      type="text"
                      id="modal-input-phone"
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                      placeholder="+92 300 1234567"
                      className="settings-input"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Access & Role */}
              <div style={{ marginBottom: "20px", paddingTop: "16px", borderTop: "1px solid #edf2ef" }} id="rq9v21">
                <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "12px" }}>
                  Access &amp; Role
                </h3>
                <div className="settings-form-grid">
                  <div className="settings-form-group">
                    <label htmlFor="modal-select-role">
                      Assigned System Role <span className="required">*</span>
                    </label>
                    <select
                      id="modal-select-role"
                      value={userFormData.roleId}
                      onChange={(e) => setUserFormData({ ...userFormData, roleId: Number(e.target.value) })}
                      className="settings-select"
                      style={{ width: "100%" }}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="settings-form-group">
                    <label htmlFor="modal-select-status">Account Status</label>
                    <select
                      id="modal-select-status"
                      value={userFormData.status}
                      onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value as "Active" | "Inactive" })}
                      className="settings-select"
                      style={{ width: "100%" }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* 14. Role Description Panel */}
                <div className="settings-info-panel" style={{ marginTop: "14px" }} id="v3gc4y">
                  <div className="settings-info-panel-title">
                    <Key size={13} className="text-emerald-600" />
                    {formSelectedRole?.name || "System"} Role
                  </div>
                  <p className="settings-info-panel-text">
                    {formSelectedRole?.description || "Select a role above to assign operational access."}
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "16px", borderTop: "1px solid #edf2ef" }} id="v3zyxw">
                <button
                  type="button"
                  onClick={() => {
                    const isDirty = userFormData.name.trim() !== "" || userFormData.email.trim() !== "";
                    if (isDirty && !window.confirm("Discard unsaved changes? Any entered information will be lost.")) {
                      return;
                    }
                    setUserModalOpen(false);
                  }}
                  className="btn-secondary"
                  id="l1tyb4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  id="xptjvr"
                >
                  <Save size={15} />
                  <span>{editingUser ? "Update User" : "Create Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
