import { useState, useEffect, useRef } from "react";
import {
    MdMenu,
    MdSettings,
    MdLogout,
    MdNotifications,
    MdNotificationsNone,
    MdCheckCircle,
    MdDelete
} from "react-icons/md";
import { HiUser, HiUserAdd } from "react-icons/hi";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Button from "./Button";
import IconButton from "./IconButton";
import { logout_user, selectWarehouse, loginSuccess } from "@/features/auth.slice";
import { auth_api } from "@/features/supplier.api";
import { addAlert } from "@/features/alert.slice";
import { FaClock, FaWarehouse } from "react-icons/fa";
import { HiSun, HiMoon } from "react-icons/hi2";
import useTheme from "@/hooks/useTheme";

export default function Header({ isOpen, setIsOpen, isMobile, title = "Dashboard" }) {
    const { theme, toggleTheme } = useTheme();
    const [showPopup, setShowPopup] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: "New Message", message: "You have received a new message from John", time: "2 min ago", read: false },
        { id: 2, title: "System Update", message: "System maintenance scheduled for tomorrow", time: "1 hour ago", read: true },
        { id: 3, title: "Payment Received", message: "Payment of $500 has been processed", time: "3 hours ago", read: false },
        { id: 4, title: "Welcome", message: "Welcome to the dashboard! Get started with our guide", time: "1 day ago", read: true },
    ]);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [associatedAccounts, setAssociatedAccounts] = useState([]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const popupRef = useRef(null);
    const notificationsRef = useRef(null);
    const whDropdownRef = useRef(null);
    const [showWhDropdown, setShowWhDropdown] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const isWarehouseSetupOrSelection = location.pathname.includes('/setup-warehouses') || location.pathname.includes('/select-warehouse');

    const menuItems = [
        { icon: <HiUser />, name: "Profile", action: () => { navigate('/dashboard/settings/profile') } },
        { icon: <HiUserAdd />, name: "Create Users", action: () => { navigate('/dashboard/settings/create-user') } },
        { icon: <MdSettings />, name: "Account Settings", action: () => { navigate('/dashboard/settings/account-settings') } },
        {
            icon: <MdLogout />, name: "Logout", action: () => {
                dispatch(logout_user())
                window.location.href = '/login';
            }
        },
    ]

    const { supplier, activeWarehouse, warehouseCoverage } = useSelector((state) => state.auth_slice);

    useEffect(() => {
        if (supplier) {
            auth_api.get_my_accounts()
                .then(res => {
                    if (res.data.status === 'success') {
                        setAssociatedAccounts(res.data.accounts || []);
                    }
                })
                .catch(() => {});
        }
    }, [supplier]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowPopup(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (whDropdownRef.current && !whDropdownRef.current.contains(event.target)) {
                setShowWhDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id) => {
        setNotifications(notifications.map(notif =>
            notif.id === id ? { ...notif, read: true } : notif
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    };

    const deleteNotification = (id) => {
        setNotifications(notifications.filter(notif => notif.id !== id));
    };

    // Generate avatar URL with primary gradient colors (#263880 to #3a56c9)
    const getAvatarUrl = (name, size = 40) => {
        return `https://ui-avatars.com/api/?background=263880&color=fff&name=${encodeURIComponent(name || 'User')}&bold=true&size=${size}`;
    };

    const getStateName = (stateId) => {
        if (!stateId) return '';
        const idStr = stateId.toString();
        const match = warehouseCoverage?.coverage_states?.find(
            (st) => (typeof st === 'object' ? (st._id?.toString() === idStr || st.id?.toString() === idStr) : st.toString() === idStr)
        );
        return match && typeof match === 'object' ? match.name : stateId;
    };

    return (
        <header className="flex items-center justify-between px-6 py-3 bg-surface border-b border-border shadow-md">
            {/* Left side - Mobile Menu Toggle */}
            <div className="flex gap-2 items-center">
                {isMobile && (
                    <IconButton
                        variant="ghost"
                        size="md"
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 hover:bg-primary/10 transition-colors"
                    >
                        <MdMenu className="text-xl text-text-secondary hover:text-primary transition-colors" />
                    </IconButton>
                )}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-linear-120 from-primary to-primary-end rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white text-sm font-bold">{title.charAt(0)}</span>
                    </div>
                    <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3 md:space-x-4">
                {/* Warehouse Selector */}
                {activeWarehouse && !isWarehouseSetupOrSelection && (
                    <div className="relative" ref={whDropdownRef}>
                        <button
                            onClick={() => setShowWhDropdown(!showWhDropdown)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface-hover/50 hover:bg-surface-hover hover:border-primary/30 transition-all duration-200"
                        >
                            <FaWarehouse className="text-primary text-sm shrink-0" />
                            <div className="text-left hidden md:block max-w-[150px]">
                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider leading-none">Warehouse</p>
                                <p className="text-xs font-semibold text-text-primary truncate" title={activeWarehouse.name}>
                                    {activeWarehouse.name}
                                </p>
                            </div>
                            <span className="text-text-muted text-[10px]">▼</span>
                        </button>

                        {showWhDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-xl z-50 py-2 max-h-60 overflow-y-auto">
                                <p className="px-4 py-1 text-[10px] font-black text-text-muted uppercase tracking-wider border-b border-border/50 pb-2">Switch Warehouse</p>
                                {warehouseCoverage?.existing_warehouses?.map((wh) => (
                                    <button
                                        key={wh._id}
                                        onClick={() => {
                                            dispatch(selectWarehouse(wh));
                                            setShowWhDropdown(false);
                                            window.location.reload();
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-linear-120 hover:from-primary/5 hover:to-primary/10 transition-all ${
                                            activeWarehouse._id === wh._id ? 'text-primary bg-primary/5' : 'text-text-secondary'
                                        }`}
                                    >
                                        <div className="truncate pr-2">
                                            <p className="font-bold truncate">{wh.name}</p>
                                            <p className="text-[10px] text-text-muted uppercase font-semibold">{getStateName(wh.state)} ({wh.unique_code})</p>
                                        </div>
                                        {activeWarehouse._id === wh._id && <span className="text-primary font-bold">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Theme Toggle */}
                <IconButton
                    variant="ghost"
                    size="md"
                    onClick={toggleTheme}
                    className="p-2 text-text-secondary hover:text-primary transition-all duration-300 group"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? (
                        <HiSun className="text-xl group-hover:rotate-45 transition-transform" />
                    ) : (
                        <HiMoon className="text-xl group-hover:-rotate-12 transition-transform" />
                    )}
                </IconButton>

                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                    <IconButton
                        variant="ghost"
                        size="md"
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 relative hover:bg-primary/10 transition-colors"
                    >
                        {unreadCount > 0 ? (
                            <MdNotifications className="text-xl text-primary" />
                        ) : (
                            <MdNotificationsNone className="text-xl text-text-secondary hover:text-primary transition-colors" />
                        )}
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-linear-120 from-danger to-danger/80 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg">
                                {unreadCount}
                            </span>
                        )}
                    </IconButton>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                            <div className="relative bg-linear-120 from-primary to-primary-end p-4">
                                <div className="absolute inset-0 bg-grid-white/10 mask-[linear-gradient(0deg,transparent,black)]"></div>
                                <div className="relative flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-white">Notifications</h3>
                                        <p className="text-xs text-white/80">{unreadCount} unread</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={markAllAsRead}
                                        className="text-xs bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                                        disabled={unreadCount === 0}
                                    >
                                        Mark all read
                                    </Button>
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto scrollbar-hover">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="w-16 h-16 bg-linear-120 from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <MdNotificationsNone className="text-3xl text-primary/40" />
                                        </div>
                                        <p className="text-text-secondary">No notifications</p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 border-b border-border hover:bg-linear-120 hover:from-primary/5 hover:to-primary/10 transition-all duration-200 ${!notification.read ? 'bg-linear-120 from-primary/5 to-primary/10' : ''
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-text-primary">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.read && (
                                                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-xs text-text-muted">
                                                        <FaClock size={10} />
                                                        {notification.time}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 ml-2">
                                                    {!notification.read && (
                                                        <IconButton
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="p-1.5 hover:bg-success/10 hover:text-success transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <MdCheckCircle className="text-success text-sm" />
                                                        </IconButton>
                                                    )}
                                                    <IconButton
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteNotification(notification.id)}
                                                        className="p-1.5 hover:bg-danger/10 hover:text-danger transition-colors"
                                                        title="Delete"
                                                    >
                                                        <MdDelete className="text-danger text-sm" />
                                                    </IconButton>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-border bg-linear-120 from-primary/5 to-primary/10">
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => navigate('/notifications')}
                                        className="w-full justify-center text-sm text-primary hover:text-primary-hover font-medium"
                                    >
                                        View all notifications
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* User Info */}
                <div className="relative" ref={popupRef}>
                    <button
                        onClick={() => setShowPopup(!showPopup)}
                        className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-linear-120 hover:from-primary/5 hover:to-primary/10 transition-all duration-200 group"
                    >
                        {/* User Avatar with Primary Gradient Background */}
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center border-2 border-white shadow-lg bg-linear-120 from-primary to-primary-end">
                                <img
                                    src={supplier?.brand_logo || getAvatarUrl(supplier?.brand_name || supplier?.company_name || 'Supplier', 40)}
                                    alt={supplier?.brand_name || supplier?.company_name || 'Supplier'}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm bg-linear-120 ${isOnline ? 'from-success to-success/80' : 'from-danger to-danger/80'}`}></div>
                        </div>

                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-semibold text-text-primary">{supplier?.brand_name || supplier?.company_name || 'Supplier'}</p>
                            {isOnline ? (
                                <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-widest border border-success/20 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                                    Online
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full bg-danger/10 text-danger text-[10px] font-black uppercase tracking-widest border border-danger/20 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-danger rounded-full"></span>
                                    Offline
                                </span>
                            )}
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {showPopup && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                            {/* User Info Header */}
                            <div className="relative bg-linear-120 from-primary to-primary-end p-4">
                                <div className="absolute inset-0 bg-grid-white/10 mask-[linear-gradient(0deg,transparent,black)]"></div>
                                <div className="relative flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg bg-white/20 backdrop-blur-sm">
                                        <img
                                            src={supplier?.brand_logo || getAvatarUrl(supplier?.brand_name || supplier?.company_name || 'Supplier', 48)}
                                            alt={supplier?.brand_name || supplier?.company_name || 'Supplier'}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white truncate max-w-[150px]" title={supplier?.brand_name || supplier?.company_name}>{supplier?.brand_name || supplier?.company_name}</p>
                                        <p className="text-xs text-white/80 truncate max-w-[150px]" title={supplier?.email}>{supplier?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="py-2">
                                {menuItems.map((item, idx) => (
                                    <Button
                                        key={idx}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            item.action();
                                            setShowPopup(false);
                                        }}
                                        className="w-full justify-start px-4 py-3 rounded-none text-text-secondary hover:text-primary hover:bg-linear-120 hover:from-primary/5 hover:to-primary/10 transition-all duration-200"
                                        leftIcon={<span className="text-primary group-hover:scale-110 transition-transform">{item.icon}</span>}
                                    >
                                        {item.name}
                                    </Button>
                                ))}
                            </div>
 
                            {associatedAccounts.length > 0 && (
                                <div className="border-t border-border/50 my-1 py-1 max-h-[160px] overflow-y-auto">
                                    <p className="px-4 py-1 text-[9px] font-black text-text-muted uppercase tracking-wider">Switch Account</p>
                                    {associatedAccounts.map((acc) => (
                                        <button
                                            key={acc._id || acc.id}
                                            onClick={async () => {
                                                try {
                                                    const targetId = acc._id || acc.id;
                                                    const { data } = await auth_api.select_account(targetId);
                                                    dispatch(loginSuccess({ token: data.token, supplier: data.supplier }));
                                                    dispatch(addAlert({ type: 'success', message: 'Switched account successfully.' }));
                                                    setShowPopup(false);
                                                    window.location.reload();
                                                } catch (err) {
                                                    dispatch(addAlert({ type: 'error', message: err.response?.data?.message || 'Failed to switch account.' }));
                                                }
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-linear-120 hover:from-primary/5 hover:to-primary/10 transition-all flex items-center gap-2 cursor-pointer border-none bg-transparent"
                                        >
                                            <div className="w-6 h-6 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border border-border">
                                                <img src={acc.brand_logo || getAvatarUrl(acc.brand_name || acc.company_name, 24)} alt={acc.brand_name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="truncate min-w-0">
                                                <p className="text-xs font-bold text-text-primary truncate">{acc.brand_name || acc.company_name}</p>
                                                <p className="text-[9px] text-text-muted truncate uppercase font-semibold">{acc.gst_number || acc.pan_number}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Footer */}
                            <div className="p-3 border-t border-border bg-linear-120 from-primary/5 to-primary/10">
                                <div className="flex justify-between text-xs">
                                    <span className="text-text-muted">Status:</span>
                                    {isOnline ? (
                                        <span className="text-success font-medium flex items-center gap-1">
                                            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                                            Online
                                        </span>
                                    ) : (
                                        <span className="text-danger font-medium flex items-center gap-1">
                                            <span className="w-2 h-2 bg-danger rounded-full"></span>
                                            Offline
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}