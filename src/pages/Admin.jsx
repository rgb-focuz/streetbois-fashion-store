import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/admin.css";
import AdminUsersManager from "../components/AdminUsersManager";
import { defaultStoreSettings, refreshStoreSettings } from "../utils/storeSettings";

function Admin() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("orders");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminRole, setAdminRole] = useState("");
  const [adminName, setAdminName] = useState("Administrator");
  const [roleLoading, setRoleLoading] = useState(true);


  const createEmptySizeRow = () => ({
    size_type: "",
    size: "",
    stock: "",
  });

  const emptyRow = {
    name: "",
    price: "",
    category: "",
    image_file: null,
    description: "",
    stock: "",
    size_stock: [createEmptySizeRow()],
    featured: false,
  };

  const emptyCollection = {
    name: "",
    image_file: null,
  };

  const [rows, setRows] = useState([{ ...emptyRow }]);
const [bulkSettings, setBulkSettings] = useState({
  name: "",
  price: "",
  category: "",
  stock: "",
  size_stock: [createEmptySizeRow()],
  featured: false,
  description: "",
});
  const [collectionForm, setCollectionForm] = useState({ ...emptyCollection });

  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [orders, setOrders] = useState([]);
const [selectedOrder, setSelectedOrder] = useState(null);
const [orderFilter, setOrderFilter] = useState("All");
const [contactMessages, setContactMessages] = useState([]);
const [selectedMessage, setSelectedMessage] = useState(null);
const [messageFilter, setMessageFilter] = useState("All");
const [messageSearch, setMessageSearch] = useState("");
const [inventoryHistory, setInventoryHistory] = useState([]);
const [historySearch, setHistorySearch] = useState("");
const [historyFilter, setHistoryFilter] = useState("All");
const [reviews, setReviews] = useState([]);
const [analyticsStartDate, setAnalyticsStartDate] = useState("");
const [analyticsEndDate, setAnalyticsEndDate] = useState("");
const [analyticsQuickRange, setAnalyticsQuickRange] = useState("All Time");
const [showInventoryBreakdown, setShowInventoryBreakdown] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [editingProduct, setEditingProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);

  const [selectedProducts, setSelectedProducts] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  const [loading, setLoading] = useState(false);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [settings, setSettings] = useState(defaultStoreSettings);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsLogoUploading, setSettingsLogoUploading] = useState(false);


  const categories = [
    "Men Clothing",
    "Kids Wear",
    "Bags",
    "Belts",
    "Caps",
    "Watches",
    "Perfumes",
    "Accessories",
    "Sneakers",
    "Slides",
  ];

  const sizePresetGroups = [
    { label: "Clothing", sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
    { label: "Shoes", sizes: ["38", "39", "40", "41", "42", "43", "44", "45", "46"] },
    { label: "Belts", sizes: ["30", "32", "34", "36", "38", "40", "42"] },
    { label: "Perfumes", sizes: ["30ml", "50ml", "100ml"] },
    { label: "General", sizes: ["One Size"] },
  ];

  const getSizeOptionsByType = (sizeType) => {
    const group = sizePresetGroups.find((item) => item.label === sizeType);
    return group ? group.sizes : [];
  };

  const normalizeProductGroupValue = (value) =>
    String(value || "").trim().toLowerCase();

  const getProductGroupKey = (product) =>
    [
      normalizeProductGroupValue(product?.name),
      normalizeProductGroupValue(product?.category),
      Number(product?.price || 0).toFixed(2),
    ].join("|");

  const getProductGroupMembers = (product) => {
    const groupKey = getProductGroupKey(product);
    return products.filter((item) => getProductGroupKey(item) === groupKey);
  };

  const getSharedStockForProduct = (product) => {
    const groupMembers = getProductGroupMembers(product);
    const stockValues = groupMembers.map((item) => Number(item.stock || 0));

    return stockValues.length > 0 ? Math.max(...stockValues) : Number(product?.stock || 0);
  };

  const withSharedStock = (product) => {
    const groupMembers = getProductGroupMembers(product);

    return {
      ...product,
      shared_stock: getSharedStockForProduct(product),
      variant_count: groupMembers.length,
    };
  };

  const formatOrderReference = (order) => {
    const firstItemName = order?.items?.[0]?.name || "ORDER";
    const productCode =
      String(firstItemName)
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 16) || "ORDER";
    const numericCode =
      String(order?.id || "")
        .replace(/\D/g, "")
        .slice(-6)
        .padStart(6, "0") || "000000";

    return `${productCode}-${numericCode}`;
  };

  const getSizeTypeFromSize = (size) => {
    if (!size) return "";

    const group = sizePresetGroups.find((item) =>
      item.sizes.includes(String(size))
    );

    return group ? group.label : "";
  };


  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = currentDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const rolePermissions = {
    super_admin: [
      "dashboard",
      "products",
      "collections",
      "manage",
      "analytics",
      "orders",
      "reports",
      "messages",
      "history",
      "settings",
      "users",
    ],
    sales_admin: ["orders", "products", "manage"],
  };

  const hasPermission = (tab) => {
    if (!adminRole) return false;
    return rolePermissions[adminRole]?.includes(tab) || false;
  };

  const getFirstAllowedTab = (role) => {
    return rolePermissions[role]?.[0] || "orders";
  };

  const changeTab = (tab) => {
    if (!hasPermission(tab)) {
      setMessage("Access denied for this section.");
      setIsMobileMenuOpen(false);
      return;
    }

    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadAdminRole = async () => {
    setRoleLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setRoleLoading(false);
      navigate("/admin-login");
      return;
    }

    const { data, error } = await supabase
      .from("admin_users")
      .select("name, role, is_active")
      .eq("email", user.email)
      .single();

    if (error || !data || data.is_active === false) {
      await supabase.auth.signOut();
      setRoleLoading(false);
      navigate("/admin-login");
      return;
    }

    setAdminRole(data.role);
    setAdminName(data.name || user.email);
    setActiveTab(getFirstAllowedTab(data.role));
    setRoleLoading(false);
  };

  const updateSettingsField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const fetchStoreSettings = async () => {
    setSettingsLoading(true);

    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (!error && data) {
      setSettings({ ...defaultStoreSettings, ...data });
    }

    setSettingsLoading(false);
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    setMessage("");

    const payload = {
      store_name: settings.store_name,
      logo_url: settings.logo_url,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      sales_whatsapp: settings.sales_whatsapp,
      mens_wear_sales_whatsapp: settings.mens_wear_sales_whatsapp,
      sneakers_sales_whatsapp: settings.sneakers_sales_whatsapp,
      email: settings.email,
      location_name: settings.location_name,
      address: settings.address,
      business_hours: settings.business_hours,
      about: settings.about,
      facebook: settings.facebook,
      instagram: settings.instagram,
      tiktok: settings.tiktok,
      twitter: settings.twitter,
      google_map: settings.google_map,
      delivery_note: settings.delivery_note,
      currency: settings.currency,
      delivery_fee: settings.delivery_fee === "" ? null : Number(settings.delivery_fee),
      free_shipping_threshold:
        settings.free_shipping_threshold === ""
          ? null
          : Number(settings.free_shipping_threshold),
      tax_percentage:
        settings.tax_percentage === "" ? null : Number(settings.tax_percentage),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("store_settings")
      .update(payload)
      .eq("id", 1);

    if (error) {
      setMessage(error.message);
      setSettingsSaving(false);
      return;
    }

    setMessage("Store settings saved successfully.");
    await refreshStoreSettings();
    fetchStoreSettings();
    setSettingsSaving(false);
  };

  useEffect(() => {
    loadAdminRole();
    fetchProducts();
    fetchCollections();
    fetchProfiles();
    fetchAdminUsers();
    fetchOrders();
    fetchContactMessages();
    fetchStoreSettings();
    fetchInventoryHistory();
    fetchReviews();
  }, []);

  useEffect(() => {
    if (!roleLoading && adminRole && !hasPermission(activeTab)) {
      setActiveTab(getFirstAllowedTab(adminRole));
    }
  }, [adminRole, activeTab, roleLoading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
  };

  const fetchCollections = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    setCollections(data || []);
  };

  const fetchProfiles = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at")
    .order("created_at", { ascending: false });

  console.log("Profiles:", data);
  console.log("Profile Error:", error);

  if (error) {
    setMessage(error.message);
    return;
  }

  setProfiles(data || []);
};

  const fetchAdminUsers = async () => {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setAdminUsers(data || []);
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setOrders(data || []);
    }
  };

  const getOrderItemProductGroupMembers = (item) => {
    const itemProduct =
      products.find((product) => product.id === item.id) || {
        name: item.name,
        category: item.category,
        price: item.price,
      };

    return getProductGroupMembers(itemProduct);
  };

  const returnStockForCancelledOrder = async (order) => {
    const groupedItems = {};

    (order.items || []).forEach((item) => {
      const itemProduct =
        products.find((product) => product.id === item.id) || {
          name: item.name,
          category: item.category,
          price: item.price,
        };

      const groupKey = getProductGroupKey(itemProduct);

      if (!groupedItems[groupKey]) {
        groupedItems[groupKey] = {
          product: itemProduct,
          quantity: 0,
        };
      }

      groupedItems[groupKey].quantity += Number(item.quantity || 0);
    });

    for (const group of Object.values(groupedItems)) {
      const groupMembers = getOrderItemProductGroupMembers(group.product);

      if (groupMembers.length === 0 || group.quantity <= 0) continue;

      const currentSharedStock = Math.max(
        ...groupMembers.map((product) => Number(product.stock || 0))
      );
      const nextStock = currentSharedStock + group.quantity;
      const groupIds = groupMembers.map((product) => product.id);

      const { error } = await supabase
        .from("products")
        .update({
          stock: nextStock,
          in_stock: nextStock > 0,
          status: nextStock > 0 ? "Active" : "Out of Stock",
        })
        .in("id", groupIds);

      if (error) throw error;

      await recordInventoryHistory({
        productId: groupMembers[0].id,
        productName: groupMembers[0].name,
        oldStock: currentSharedStock,
        newStock: nextStock,
        actionType: "Order Cancelled",
        reason: `Returned stock from cancelled order ${order.id}`,
      });
    }
  };

  const updateOrderStatus = async (id, status) => {
    const currentOrder = orders.find((order) => order.id === id);
    const wasCancelled = currentOrder?.status === "Cancelled";
    const shouldReturnStock = currentOrder && !wasCancelled && status === "Cancelled";

    if (shouldReturnStock) {
      try {
        await returnStockForCancelledOrder(currentOrder);
      } catch (error) {
        setMessage(error.message);
        return;
      }
    }

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      shouldReturnStock
        ? "Order cancelled and stock returned."
        : "Order status updated."
    );

    if (selectedOrder?.id === id) {
      setSelectedOrder({ ...selectedOrder, status });
    }

    fetchProducts();
    fetchInventoryHistory();
    fetchOrders();
  };

  const fetchContactMessages = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setContactMessages(data || []);
    }
  };

  const fetchInventoryHistory = async () => {
    const { data, error } = await supabase
      .from("inventory_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setInventoryHistory(data || []);
    }
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setReviews(data || []);
    }
  };

  const recordInventoryHistory = async ({
    productId,
    productName,
    oldStock,
    newStock,
    actionType = "Stock Update",
    reason = "Manual admin update",
  }) => {
    if (Number(oldStock) === Number(newStock)) return;

    await supabase.from("inventory_history").insert({
      product_id: productId,
      product_name: productName,
      old_stock: Number(oldStock || 0),
      new_stock: Number(newStock || 0),
      quantity_changed: Number(newStock || 0) - Number(oldStock || 0),
      action_type: actionType,
      reason: reason || "Manual admin update",
      changed_by: "Administrator",
    });
  };

  const markMessageAsRead = async (id, isRead = true) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: isRead })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(isRead ? "Message marked as read." : "Message marked as unread.");
    fetchContactMessages();

    if (selectedMessage?.id === id) {
      setSelectedMessage({ ...selectedMessage, is_read: isRead });
    }
  };

  const deleteContactMessage = async (id) => {
    if (!window.confirm("Delete this message?")) return;

    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Message deleted successfully.");
    setSelectedMessage(null);
    fetchContactMessages();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin-login");
  };

  const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  const normalizeSizeStockForInput = (sizeStock, sizes = []) => {
    if (
      sizeStock &&
      typeof sizeStock === "object" &&
      !Array.isArray(sizeStock)
    ) {
      const rows = Object.entries(sizeStock).map(([size, stock]) => ({
        size,
        stock: String(stock ?? ""),
      }));

      return rows.length > 0 ? rows : [createEmptySizeRow()];
    }

    if (Array.isArray(sizes) && sizes.length > 0) {
      return sizes.map((size) => ({
        size,
        stock: "",
      }));
    }

    return [createEmptySizeRow()];
  };

  const sizeRowsToObject = (sizeRows) => {
    if (!Array.isArray(sizeRows)) return null;

    const sizeStock = {};

    sizeRows.forEach((row) => {
      const size = String(row.size || "").trim();
      const stock = Number(row.stock || 0);

      if (size) {
        sizeStock[size] = stock < 0 ? 0 : stock;
      }
    });

    return Object.keys(sizeStock).length > 0 ? sizeStock : null;
  };

  const getSizesFromSizeStock = (sizeStock) => {
    if (!sizeStock) return null;
    return Object.keys(sizeStock);
  };

  const getTotalStockFromSizeStock = (sizeStock, fallbackStock = 0) => {
    if (!sizeStock) return Number(fallbackStock || 0);

    return Object.values(sizeStock).reduce(
      (total, value) => total + Number(value || 0),
      0
    );
  };

  const formatSizeStockForDisplay = (sizeStock, sizes = []) => {
    if (
      sizeStock &&
      typeof sizeStock === "object" &&
      !Array.isArray(sizeStock)
    ) {
      return Object.entries(sizeStock)
        .map(([size, stock]) => `${size}: ${stock}`)
        .join(", ");
    }

    if (Array.isArray(sizes) && sizes.length > 0) {
      return sizes.join(", ");
    }

    return "Not set";
  };

  const handleSizeStockChange = (productIndex, sizeIndex, field, value) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) => {
        if (rowIndex !== productIndex) return row;

        const currentSizeStock =
          Array.isArray(row.size_stock) && row.size_stock.length > 0
            ? row.size_stock
            : [createEmptySizeRow()];

        return {
          ...row,
          size_stock: currentSizeStock.map((sizeRow, currentIndex) =>
            currentIndex === sizeIndex
              ? {
                  ...sizeRow,
                  [field]: value,
                  ...(field === "size_type" ? { size: "" } : {}),
                }
              : sizeRow
          ),
        };
      })
    );
  };

  const addSizeStockRow = (productIndex) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === productIndex
          ? {
              ...row,
              size_stock: [
                ...(Array.isArray(row.size_stock) ? row.size_stock : []),
                createEmptySizeRow(),
              ],
            }
          : row
      )
    );
  };

  const removeSizeStockRow = (productIndex, sizeIndex) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) => {
        if (rowIndex !== productIndex) return row;

        const nextRows = (row.size_stock || []).filter(
          (_, currentIndex) => currentIndex !== sizeIndex
        );

        return {
          ...row,
          size_stock: nextRows.length > 0 ? nextRows : [createEmptySizeRow()],
        };
      })
    );
  };

  const handleBulkSizeStockChange = (sizeIndex, field, value) => {
    setBulkSettings((currentSettings) => {
      const currentSizeStock =
        Array.isArray(currentSettings.size_stock) &&
        currentSettings.size_stock.length > 0
          ? currentSettings.size_stock
          : [createEmptySizeRow()];

      return {
        ...currentSettings,
        size_stock: currentSizeStock.map((sizeRow, currentIndex) =>
          currentIndex === sizeIndex
            ? {
                ...sizeRow,
                [field]: value,
                ...(field === "size_type" ? { size: "" } : {}),
              }
            : sizeRow
        ),
      };
    });
  };

  const addBulkSizeStockRow = () => {
    setBulkSettings((currentSettings) => ({
      ...currentSettings,
      size_stock: [
        ...(Array.isArray(currentSettings.size_stock)
          ? currentSettings.size_stock
          : []),
        createEmptySizeRow(),
      ],
    }));
  };

  const removeBulkSizeStockRow = (sizeIndex) => {
    setBulkSettings((currentSettings) => {
      const nextRows = (currentSettings.size_stock || []).filter(
        (_, currentIndex) => currentIndex !== sizeIndex
      );

      return {
        ...currentSettings,
        size_stock: nextRows.length > 0 ? nextRows : [createEmptySizeRow()],
      };
    });
  };

  const handleEditingSizeStockChange = (sizeIndex, field, value) => {
    setEditingProduct((currentProduct) => {
      if (!currentProduct) return currentProduct;

      const currentSizeStock =
        Array.isArray(currentProduct.size_stock) &&
        currentProduct.size_stock.length > 0
          ? currentProduct.size_stock
          : [createEmptySizeRow()];

      return {
        ...currentProduct,
        size_stock: currentSizeStock.map((sizeRow, currentIndex) =>
          currentIndex === sizeIndex
            ? {
                ...sizeRow,
                [field]: value,
                ...(field === "size_type" ? { size: "" } : {}),
              }
            : sizeRow
        ),
      };
    });
  };

  const addEditingSizeStockRow = () => {
    setEditingProduct((currentProduct) => {
      if (!currentProduct) return currentProduct;

      return {
        ...currentProduct,
        size_stock: [
          ...(Array.isArray(currentProduct.size_stock)
            ? currentProduct.size_stock
            : []),
          createEmptySizeRow(),
        ],
      };
    });
  };

  const removeEditingSizeStockRow = (sizeIndex) => {
    setEditingProduct((currentProduct) => {
      if (!currentProduct) return currentProduct;

      const nextRows = (currentProduct.size_stock || []).filter(
        (_, currentIndex) => currentIndex !== sizeIndex
      );

      return {
        ...currentProduct,
        size_stock: nextRows.length > 0 ? nextRows : [createEmptySizeRow()],
      };
    });
  };

  const getSizeRowStockValue = (sizeRows, size) => {
    const found = (Array.isArray(sizeRows) ? sizeRows : []).find(
      (row) => String(row.size || "").trim() === size
    );

    return found ? found.stock : "";
  };

  const isSizeRowSelected = (sizeRows, size) =>
    (Array.isArray(sizeRows) ? sizeRows : []).some(
      (row) => String(row.size || "").trim() === size
    );

  const toggleSizeInRows = (sizeRows, size) => {
    const cleanRows = (Array.isArray(sizeRows) ? sizeRows : [])
      .filter((row) => String(row.size || "").trim())
      .map((row) => ({ ...row, size: String(row.size || "").trim() }));

    if (cleanRows.some((row) => row.size === size)) {
      return cleanRows.filter((row) => row.size !== size);
    }

    return [...cleanRows, { size, stock: "" }];
  };

  const updateStockForSize = (sizeRows, size, stock) => {
    const cleanRows = (Array.isArray(sizeRows) ? sizeRows : [])
      .filter((row) => String(row.size || "").trim())
      .map((row) => ({ ...row, size: String(row.size || "").trim() }));

    if (cleanRows.some((row) => row.size === size)) {
      return cleanRows.map((row) =>
        row.size === size ? { ...row, stock } : row
      );
    }

    return [...cleanRows, { size, stock }];
  };

  const toggleBulkPresetSize = (size) => {
    setBulkSettings((currentSettings) => ({
      ...currentSettings,
      size_stock: toggleSizeInRows(currentSettings.size_stock, size),
    }));
  };

  const updateBulkPresetSizeStock = (size, stock) => {
    setBulkSettings((currentSettings) => ({
      ...currentSettings,
      size_stock: updateStockForSize(currentSettings.size_stock, size, stock),
    }));
  };

  const toggleProductPresetSize = (productIndex, size) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === productIndex
          ? { ...row, size_stock: toggleSizeInRows(row.size_stock, size) }
          : row
      )
    );
  };

  const updateProductPresetSizeStock = (productIndex, size, stock) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === productIndex
          ? { ...row, size_stock: updateStockForSize(row.size_stock, size, stock) }
          : row
      )
    );
  };

  const toggleEditingPresetSize = (size) => {
    setEditingProduct((currentProduct) => ({
      ...currentProduct,
      size_stock: toggleSizeInRows(currentProduct.size_stock, size),
    }));
  };

  const updateEditingPresetSizeStock = (size, stock) => {
    setEditingProduct((currentProduct) => ({
      ...currentProduct,
      size_stock: updateStockForSize(currentProduct.size_stock, size, stock),
    }));
  };

  const addRow = () => {
    setRows([...rows, { ...emptyRow }]);
  };

  const removeRow = (index) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const uploadImage = async (file, category) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const folder = category.toLowerCase().replaceAll(" ", "-");
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const uploadCollectionImage = async (file) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const filePath = `collections/${fileName}`;

    const { error } = await supabase.storage
      .from("category-images")
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("category-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const uploadBrandLogo = async (file) => {
    if (!file) return;

    setSettingsLogoUploading(true);
    setMessage("");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `brand/${fileName}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      updateSettingsField("logo_url", data.publicUrl);
      setMessage("Logo uploaded. Click Save Changes to publish it.");
    } catch (error) {
      const uploadMessage =
        error.message?.includes("row-level security")
          ? "Logo upload is blocked by Supabase Storage security policy. Run the storage policy SQL, or paste a logo URL below."
          : error.message || "Logo upload failed.";

      setMessage(uploadMessage);
    } finally {
      setSettingsLogoUploading(false);
    }
  };

const handleMultipleImages = (files) => {
  const fileArray = Array.from(files);

  const newRows = fileArray.map((file) => ({
    ...emptyRow,
    image_file: file,
    name: file.name.replace(/\.[^/.]+$/, "").replaceAll("-", " "),
  }));

  setRows((previousRows) => {
  const hasEmptyRow =
    previousRows.length === 1 &&
    !previousRows[0].name &&
    !previousRows[0].price &&
    !previousRows[0].image_file;

  if (hasEmptyRow) {
    return newRows;
  }

  return [...previousRows, ...newRows];
});
};


  const uploadAllProducts = async () => {
    setLoading(true);
    setMessage("");

    try {
      const productsToUpload = [];

      for (const item of rows) {
        if (!item.name || !item.price || !item.category || !item.image_file) {
          continue;
        }

        const imageUrl = await uploadImage(item.image_file, item.category);

        const sizeStock = sizeRowsToObject(item.size_stock);
        const totalStock = getTotalStockFromSizeStock(sizeStock, item.stock);

        productsToUpload.push({
          name: item.name,
          price: Number(item.price),
          category: item.category,
          image_url: imageUrl,
          description: item.description,
          stock: totalStock,
          sizes: getSizesFromSizeStock(sizeStock),
          size_stock: sizeStock,
          in_stock: totalStock > 0,
          featured: item.featured,
          status: totalStock > 0 ? "Active" : "Out of Stock",
        });
      }

      if (productsToUpload.length === 0) {
        setMessage("Please fill product name, price, category and image.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("products").insert(productsToUpload);

      if (error) throw error;

      setMessage(`${productsToUpload.length} products uploaded successfully.`);
      setRows([{ ...emptyRow }]);
      fetchProducts();
    } catch (error) {
      setMessage(error.message);
    }

    setLoading(false);
  };

  const uploadCollection = async () => {
    setCollectionLoading(true);
    setMessage("");

    try {
      if (!collectionForm.name || !collectionForm.image_file) {
        setMessage("Please add collection name and image.");
        setCollectionLoading(false);
        return;
      }

      const imageUrl = await uploadCollectionImage(collectionForm.image_file);

      const { error } = await supabase.from("categories").insert({
        name: collectionForm.name,
        image_url: imageUrl,
      });

      if (error) throw error;

      setMessage("Collection uploaded successfully.");
      setCollectionForm({ ...emptyCollection });
      fetchCollections();
    } catch (error) {
      setMessage(error.message);
    }

    setCollectionLoading(false);
  };

  const startEditProduct = (product) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description || "",
      stock: getSharedStockForProduct(product),
      size_stock: normalizeSizeStockForInput(product.size_stock, product.sizes),
      original_stock: getSharedStockForProduct(product),
      original_name: product.name,
      original_price: product.price,
      original_category: product.category,
      stock_reason: "Manual admin update",
      featured: product.featured || false,
      status: product.status || "Active",
      image_url: product.image_url,
      new_image: null,
    });
  };

  const updateProduct = async () => {
    if (!editingProduct) return;

    try {
      let imageUrl = editingProduct.image_url;

      if (editingProduct.new_image) {
        imageUrl = await uploadImage(
          editingProduct.new_image,
          editingProduct.category
        );
      }

      const sizeStock = sizeRowsToObject(editingProduct.size_stock);
      const oldStock = Number(editingProduct.original_stock || 0);
      const newStock = getTotalStockFromSizeStock(
        sizeStock,
        editingProduct.stock
      );

      const { error } = await supabase
        .from("products")
        .update({
          name: editingProduct.name,
          price: Number(editingProduct.price),
          category: editingProduct.category,
          description: editingProduct.description,
          stock: newStock,
          sizes: getSizesFromSizeStock(sizeStock),
          size_stock: sizeStock,
          in_stock: newStock > 0,
          featured: editingProduct.featured,
          status: newStock > 0 ? editingProduct.status : "Out of Stock",
          image_url: imageUrl,
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      const { error: groupStockError } = await supabase
        .from("products")
        .update({
          stock: newStock,
          sizes: getSizesFromSizeStock(sizeStock),
          size_stock: sizeStock,
          in_stock: newStock > 0,
          status: newStock > 0 ? editingProduct.status : "Out of Stock",
        })
        .neq("id", editingProduct.id)
        .eq("name", editingProduct.original_name)
        .eq("category", editingProduct.original_category)
        .eq("price", Number(editingProduct.original_price));

      if (groupStockError) throw groupStockError;

      await recordInventoryHistory({
        productId: editingProduct.id,
        productName: editingProduct.name,
        oldStock,
        newStock,
        actionType: "Stock Update",
        reason: editingProduct.stock_reason || "Manual admin update",
      });

      setMessage("Product updated successfully.");
      setEditingProduct(null);
      fetchProducts();
      fetchInventoryHistory();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const toggleFeatured = async (product) => {
    const { error } = await supabase
      .from("products")
      .update({ featured: !product.featured })
      .eq("id", product.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Featured status updated.");
    fetchProducts();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    await supabase.from("products").delete().eq("id", id);
    setMessage("Product deleted successfully.");
    fetchProducts();
  };

  const bulkDeleteProducts = async () => {
    if (selectedProducts.length === 0) {
      setMessage("Please select products to delete.");
      return;
    }

    if (!window.confirm(`Delete ${selectedProducts.length} selected products?`)) {
      return;
    }

    setBulkDeleteLoading(true);

    const { error } = await supabase
      .from("products")
      .delete()
      .in("id", selectedProducts);

    if (error) {
      setMessage(error.message);
      setBulkDeleteLoading(false);
      return;
    }

    setMessage(`${selectedProducts.length} products deleted successfully.`);
    setSelectedProducts([]);
    fetchProducts();
    setBulkDeleteLoading(false);
  };

  const deleteCollection = async (id) => {
    if (!window.confirm("Delete this collection?")) return;

    await supabase.from("categories").delete().eq("id", id);
    setMessage("Collection deleted successfully.");
    fetchCollections();
  };

  const toggleSelectProduct = (id) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter((item) => item !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const getStockBadge = (stock) => {
    const qty = Number(stock || 0);

    if (qty <= 0) {
      return <span className="stock-badge out">Out of Stock</span>;
    }

    if (qty <= 5) {
      return <span className="stock-badge low">Low Stock</span>;
    }

    return <span className="stock-badge in">In Stock</span>;
  };

  const filteredProducts = products.map(withSharedStock).filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at) - new Date(a.created_at);
    }

    if (sortBy === "oldest") {
      return new Date(a.created_at) - new Date(b.created_at);
    }

    if (sortBy === "price-low") {
      return Number(a.price) - Number(b.price);
    }

    if (sortBy === "price-high") {
      return Number(b.price) - Number(a.price);
    }

    if (sortBy === "stock-low") {
      return Number(a.shared_stock || 0) - Number(b.shared_stock || 0);
    }

    if (sortBy === "stock-high") {
      return Number(b.shared_stock || 0) - Number(a.shared_stock || 0);
    }

    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / productsPerPage) || 1;

  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const selectAllCurrentPage = () => {
    const currentPageIds = paginatedProducts.map((product) => product.id);

    const allSelected = currentPageIds.every((id) =>
      selectedProducts.includes(id)
    );

    if (allSelected) {
      setSelectedProducts(
        selectedProducts.filter((id) => !currentPageIds.includes(id))
      );
    } else {
      const merged = [...new Set([...selectedProducts, ...currentPageIds])];
      setSelectedProducts(merged);
    }
  };

  const baseActiveOrders = orders.filter((order) => order.status !== "Cancelled");

  const activeOrders = baseActiveOrders.filter((order) => {
    const orderDate = new Date(order.created_at);

    if (analyticsStartDate) {
      const start = new Date(`${analyticsStartDate}T00:00:00`);
      if (orderDate < start) return false;
    }

    if (analyticsEndDate) {
      const end = new Date(`${analyticsEndDate}T23:59:59`);
      if (orderDate > end) return false;
    }

    return true;
  });

  const applyAnalyticsRange = (range) => {
    const todayValue = new Date();
    const formatInputDate = (date) => date.toISOString().split("T")[0];

    if (range === "Today") {
      const value = formatInputDate(todayValue);
      setAnalyticsStartDate(value);
      setAnalyticsEndDate(value);
    }

    if (range === "7 Days") {
      const start = new Date(todayValue);
      start.setDate(start.getDate() - 6);
      setAnalyticsStartDate(formatInputDate(start));
      setAnalyticsEndDate(formatInputDate(todayValue));
    }

    if (range === "30 Days") {
      const start = new Date(todayValue);
      start.setDate(start.getDate() - 29);
      setAnalyticsStartDate(formatInputDate(start));
      setAnalyticsEndDate(formatInputDate(todayValue));
    }

    if (range === "This Month") {
      const start = new Date(todayValue.getFullYear(), todayValue.getMonth(), 1);
      setAnalyticsStartDate(formatInputDate(start));
      setAnalyticsEndDate(formatInputDate(todayValue));
    }

    if (range === "All Time") {
      setAnalyticsStartDate("");
      setAnalyticsEndDate("");
    }

    setAnalyticsQuickRange(range);
  };

  const totalRevenue = activeOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const today = new Date();

  const todaySales = activeOrders.filter((order) => {
    const orderDate = new Date(order.created_at);
    return orderDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todaySales.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const monthlySales = activeOrders.filter((order) => {
    const orderDate = new Date(order.created_at);
    return (
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    );
  });

  const monthlyRevenue = monthlySales.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const productSalesMap = {};

  activeOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      if (!productSalesMap[item.name]) {
        productSalesMap[item.name] = {
          name: item.name,
          quantity: 0,
          revenue: 0,
          image_url: item.image_url,
        };
      }

      productSalesMap[item.name].quantity += Number(item.quantity || 0);
      productSalesMap[item.name].revenue += Number(item.subtotal || 0);
    });
  });

  const salesProducts = Object.values(productSalesMap);

  const bestSellers = [...salesProducts]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const worstSellers = products
    .map((product) => {
      const soldData = productSalesMap[product.name];
      return {
        name: product.name,
        quantity: soldData ? soldData.quantity : 0,
        revenue: soldData ? soldData.revenue : 0,
        image_url: product.image_url,
      };
    })
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);

  const customerOrderCount = {};

  activeOrders.forEach((order) => {
    const key = order.customer_phone || order.customer_email || order.customer_name;
    if (!key) return;
    customerOrderCount[key] = (customerOrderCount[key] || 0) + 1;
  });

  const returningCustomers = Object.values(customerOrderCount).filter(
    (count) => count > 1
  ).length;

  const averageOrderValue =
    activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;


  const getStartOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getRevenueBetween = (startDate, endDate) => {
    return activeOrders
      .filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startDate && orderDate <= endDate;
      })
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
  };

  const getGrowthPercentage = (current, previous) => {
    if (previous === 0 && current === 0) return 0;
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  const now = new Date();
  const todayStart = getStartOfDay(now);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const previousWeekStart = new Date(todayStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 14);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const yesterdayRevenue = getRevenueBetween(yesterdayStart, todayStart);
  const weeklyRevenue = getRevenueBetween(weekStart, now);
  const previousWeekRevenue = getRevenueBetween(previousWeekStart, weekStart);
  const lastMonthRevenue = getRevenueBetween(lastMonthStart, lastMonthEnd);

  const growthCards = [
    {
      label: "Today",
      value: getGrowthPercentage(todayRevenue, yesterdayRevenue),
      current: todayRevenue,
      previous: yesterdayRevenue,
    },
    {
      label: "This Week",
      value: getGrowthPercentage(weeklyRevenue, previousWeekRevenue),
      current: weeklyRevenue,
      previous: previousWeekRevenue,
    },
    {
      label: "This Month",
      value: getGrowthPercentage(monthlyRevenue, lastMonthRevenue),
      current: monthlyRevenue,
      previous: lastMonthRevenue,
    },
  ];

  const monthlyRevenueChart = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const month = date.getMonth();
    const year = date.getFullYear();

    const revenue = activeOrders
      .filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === month && orderDate.getFullYear() === year;
      })
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    return {
      label: date.toLocaleString("default", { month: "short" }),
      revenue,
    };
  });

  const maxMonthlyChartRevenue = Math.max(
    ...monthlyRevenueChart.map((item) => item.revenue),
    1
  );

  const recentOrders = orders.slice(0, 5);

  const restockProducts = products
    .filter((product) => Number(product.stock || 0) <= 5)
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    .slice(0, 5);

  const pendingOrdersCount = orders.filter((order) => order.status === "Pending").length;
  const unreadMessagesCount = contactMessages.filter((item) => !item.is_read).length;
  const notificationCount = pendingOrdersCount + restockProducts.length + unreadMessagesCount;

  const filteredContactMessages = contactMessages.filter((item) => {
    const matchesFilter =
      messageFilter === "All" ||
      (messageFilter === "Unread" && !item.is_read) ||
      (messageFilter === "Read" && item.is_read);

    const searchValue = `${item.name || ""} ${item.email || ""} ${
      item.phone || ""
    } ${item.subject || ""} ${item.message || ""}`.toLowerCase();

    const matchesSearch = searchValue.includes(messageSearch.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const filteredInventoryHistory = inventoryHistory.filter((item) => {
    const matchesFilter =
      historyFilter === "All" || item.action_type === historyFilter;

    const searchValue = `${item.product_name || ""} ${item.reason || ""} ${
      item.changed_by || ""
    }`.toLowerCase();

    return matchesFilter && searchValue.includes(historySearch.toLowerCase());
  });

  const totalStockIncreases = inventoryHistory.filter(
    (item) => Number(item.quantity_changed || 0) > 0
  ).length;

  const totalStockReductions = inventoryHistory.filter(
    (item) => Number(item.quantity_changed || 0) < 0
  ).length;

  const productCategoryMap = {};
  products.forEach((product) => {
    productCategoryMap[product.name] = product.category || "Uncategorized";
  });

  const categorySalesMap = {};
  activeOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const category = productCategoryMap[item.name] || "Uncategorized";

      if (!categorySalesMap[category]) {
        categorySalesMap[category] = {
          category,
          quantity: 0,
          revenue: 0,
        };
      }

      categorySalesMap[category].quantity += Number(item.quantity || 0);
      categorySalesMap[category].revenue += Number(item.subtotal || 0);
    });
  });

  const totalCategoryQuantity = Object.values(categorySalesMap).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const topSellingCategories = Object.values(categorySalesMap)
    .map((item) => ({
      ...item,
      percentage:
        totalCategoryQuantity > 0 ? (item.quantity / totalCategoryQuantity) * 100 : 0,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);


  const completedOrders = orders.filter((order) => order.status === "Delivered").length;
  const cancelledOrders = orders.filter((order) => order.status === "Cancelled").length;
  const conversionStatusRate =
    orders.length > 0 ? ((completedOrders / orders.length) * 100).toFixed(1) : "0.0";

  const weekSales = activeOrders.filter((order) => {
    const orderDate = new Date(order.created_at);
    return orderDate >= weekStart && orderDate <= now;
  });

  const weeklyOrdersCount = weekSales.length;

  const dailySalesTrend = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(todayStart);
    date.setDate(date.getDate() - (6 - index));

    const dayRevenue = activeOrders
      .filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate.toDateString() === date.toDateString();
      })
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    return {
      label: date.toLocaleDateString("en-GB", { weekday: "short" }),
      revenue: dayRevenue,
    };
  });

  const maxDailyRevenue = Math.max(...dailySalesTrend.map((item) => item.revenue), 1);

  const hourlySalesTrend = Array.from({ length: 12 }).map((_, index) => {
    const hour = index * 2;
    const revenue = todaySales
      .filter((order) => new Date(order.created_at).getHours() >= hour && new Date(order.created_at).getHours() < hour + 2)
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    return {
      label: `${String(hour).padStart(2, "0")}:00`,
      revenue,
    };
  });

  const maxHourlyRevenue = Math.max(...hourlySalesTrend.map((item) => item.revenue), 1);

  const productReviewMap = {};
  reviews.forEach((review) => {
    if (!review.product_id) return;
    if (!productReviewMap[review.product_id]) {
      productReviewMap[review.product_id] = { total: 0, count: 0 };
    }
    productReviewMap[review.product_id].total += Number(review.rating || 0);
    productReviewMap[review.product_id].count += 1;
  });

  const topRatedProducts = products
    .map((product) => {
      const reviewData = productReviewMap[product.id];
      const count = reviewData ? reviewData.count : 0;
      const average = count > 0 ? reviewData.total / count : 0;
      return { ...product, review_count: count, average_rating: average };
    })
    .filter((product) => product.review_count > 0)
    .sort((a, b) => b.average_rating - a.average_rating || b.review_count - a.review_count)
    .slice(0, 5);

  const fastestSellingProducts = [...salesProducts]
    .map((item) => {
      const product = products.find((prod) => prod.name === item.name);
      const daysLive = product?.created_at
        ? Math.max(1, Math.ceil((now - new Date(product.created_at)) / (1000 * 60 * 60 * 24)))
        : 1;
      return {
        ...item,
        sales_velocity: item.quantity / daysLive,
      };
    })
    .sort((a, b) => b.sales_velocity - a.sales_velocity)
    .slice(0, 5);

  const slowMovingInventory = products
    .map((product) => {
      const soldData = productSalesMap[product.name];
      const sold = soldData ? soldData.quantity : 0;
      const stock = Number(product.stock || 0);
      return {
        ...product,
        sold,
        stock_value: stock * Number(product.price || 0),
      };
    })
    .filter((product) => Number(product.stock || 0) > 0)
    .sort((a, b) => a.sold - b.sold || b.stock_value - a.stock_value)
    .slice(0, 5);

  const mostViewedProducts = [...products]
    .map((product) => ({
      ...product,
      views: Number(product.views || product.view_count || product.analytics_views || 0),
    }))
    .filter((product) => product.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const mostWishlistedProducts = [...products]
    .map((product) => ({
      ...product,
      wishlist_count: Number(product.wishlist_count || product.wishlist_total || 0),
    }))
    .filter((product) => product.wishlist_count > 0)
    .sort((a, b) => b.wishlist_count - a.wishlist_count)
    .slice(0, 5);

const inventoryGroupedMap = {};

products.forEach((product) => {
  const name = String(product.name || "").trim().toUpperCase();
  const category = product.category || "Uncategorized";
  const price = Number(product.price || 0);
  const stock = Number(product.stock || 0);

  if (!name) return;

  const key = `${name}-${category}-${price}`;

  if (!inventoryGroupedMap[key]) {
    inventoryGroupedMap[key] = {
      id: product.id,
      name,
      category,
      price,
      stock,
      value: price * stock,
      image_url: product.image_url,
      image_count: 1,
      product_ids: [product.id],
    };
  } else {
    inventoryGroupedMap[key].image_count += 1;
    inventoryGroupedMap[key].product_ids.push(product.id);

    // Keep the stock as one total stock for the grouped product.
    // We do not add stock again for each image.
    inventoryGroupedMap[key].stock = stock;
    inventoryGroupedMap[key].value = price * stock;
  }
});

const inventoryBreakdown = Object.values(inventoryGroupedMap).sort(
  (a, b) => b.value - a.value
);

const inventoryValue = inventoryBreakdown.reduce(
  (sum, item) => sum + item.value,
  0
);

const totalInventoryUnits = inventoryBreakdown.reduce(
  (sum, item) => sum + item.stock,
  0
);

  const estimatedProfit = totalRevenue * 0.3;

  const analyticsKpis = [
    {
      title: "Today Revenue",
      value: `GH₵ ${todayRevenue.toFixed(2)}`,
      note: `${todaySales.length} orders today`,
      trend: growthCards[0].value,
    },
    {
      title: "Weekly Revenue",
      value: `GH₵ ${weeklyRevenue.toFixed(2)}`,
      note: `${weeklyOrdersCount} orders this week`,
      trend: growthCards[1].value,
    },
    {
      title: "Average Order Value",
      value: `GH₵ ${averageOrderValue.toFixed(2)}`,
      note: "Average customer basket",
      trend: 0,
    },
    {
      title: "Completion Rate",
      value: `${conversionStatusRate}%`,
      note: `${completedOrders} delivered · ${cancelledOrders} cancelled`,
      trend: Number(conversionStatusRate),
    },
    {
      title: "Inventory Value",
      value: `GH₵ ${inventoryValue.toFixed(2)}`,
      note: `${products.length} products tracked`,
      trend: 0,
    },
    {
      title: "Estimated Profit",
      value: `GH₵ ${estimatedProfit.toFixed(2)}`,
      note: "Estimated at 30% margin",
      trend: growthCards[2].value,
    },
  ];

  const exportAnalyticsCSV = () => {
    const rows = [
      ["Metric", "Value", "Note"],
      ...analyticsKpis.map((item) => [item.title, item.value, item.note]),
      ["Date Range", analyticsQuickRange, `${analyticsStartDate || "Beginning"} to ${analyticsEndDate || "Today"}`],
      ["Total Revenue", `GH₵ ${totalRevenue.toFixed(2)}`, `${activeOrders.length} active orders`],
      ["Average Order Value", `GH₵ ${averageOrderValue.toFixed(2)}`, "Filtered range"],
      ["Returning Customers", returningCustomers, "Filtered range"],
    ];

    downloadCSV("streetbois-analytics-report.csv", rows[0], rows.slice(1));
  };

  const loadPdfTools = async () => {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    return {
      jsPDF,
      autoTable: autoTableModule.default,
    };
  };

  const exportAnalyticsPDF = async () => {
    const { jsPDF, autoTable } = await loadPdfTools();
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("STREETBOIS FASHION", 14, 18);
    doc.setFontSize(12);
    doc.text("Executive Analytics Report", 14, 28);
    doc.text(`Range: ${analyticsQuickRange}`, 14, 36);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 44);

    autoTable(doc, {
      startY: 54,
      head: [["Metric", "Value", "Note"]],
      body: analyticsKpis.map((item) => [item.title, item.value, item.note]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
    });

    doc.save("streetbois-analytics-report.pdf");
  };

  const formatReportDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  const escapeCSV = (value) => {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  };

  const downloadCSV = (filename, headers, rows) => {
    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const productReportRows = products.map((product) => [
    product.name,
    product.category,
    product.price,
    product.stock || 0,
    product.featured ? "Featured" : "Normal",
    product.status || "Active",
    formatReportDate(product.created_at),
  ]);

  const orderReportRows = orders.map((order) => [
    order.customer_name,
    order.customer_phone,
    order.customer_email || "N/A",
    order.delivery_address,
    order.total,
    order.status,
    (order.items || []).length,
    formatReportDate(order.created_at),
  ]);

  const exportProductsCSV = () => {
    downloadCSV(
      "streetbois-products-report.csv",
      ["Name", "Category", "Price", "Stock", "Featured", "Status", "Date Added"],
      productReportRows
    );
  };

  const exportOrdersCSV = () => {
    downloadCSV(
      "streetbois-orders-report.csv",
      ["Customer", "Phone", "Email", "Address", "Total", "Status", "Items", "Date"],
      orderReportRows
    );
  };

  const exportProductsPDF = async () => {
    const { jsPDF, autoTable } = await loadPdfTools();
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("STREETBOIS FASHION", 14, 18);
    doc.setFontSize(12);
    doc.text("Products Report", 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

    autoTable(doc, {
      startY: 45,
      head: [["Name", "Category", "Price", "Stock", "Featured", "Status"]],
      body: products.map((product) => [
        product.name,
        product.category,
        `GH₵ ${product.price}`,
        product.stock || 0,
        product.featured ? "Featured" : "Normal",
        product.status || "Active",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
    });

    doc.save("streetbois-products-report.pdf");
  };

  const exportOrdersPDF = async () => {
    const { jsPDF, autoTable } = await loadPdfTools();
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("STREETBOIS FASHION", 14, 18);
    doc.setFontSize(12);
    doc.text("Orders Report", 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);
    doc.text(`Total Revenue: GH₵ ${totalRevenue.toFixed(2)}`, 14, 44);

    autoTable(doc, {
      startY: 52,
      head: [["Customer", "Phone", "Total", "Status", "Date"]],
      body: orders.map((order) => [
        order.customer_name,
        order.customer_phone,
        `GH₵ ${order.total}`,
        order.status,
        formatReportDate(order.created_at),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
    });

    doc.save("streetbois-orders-report.pdf");
  };


  const pageTitles = {
    dashboard: "Dashboard",
    products: "Add Products",
    collections: "Collections",
    manage: "Products",
    analytics: "Analytics",
    orders: "Orders",
    reports: "Reports",
    messages: "Messages",
    history: "Inventory History",
    settings: "Settings",
    users: "Users",
  };

  const pageSubtitles = {
    dashboard: "Welcome back, Admin.",
    products: "Upload and manage product entries.",
    collections: "Create and organize product collections.",
    manage: "Search, edit, preview and manage inventory.",
    analytics: "Track sales, revenue and store performance.",
    orders: "Review customer orders and update status.",
    reports: "Export product and order reports.",
    messages: "Read customer contact messages.",
    history: "Track every stock movement and inventory update.",
    settings: "Manage store business details.",
    users: "View registered customer accounts.",
  };

  const adminNavItems = [
    { key: "dashboard", label: "Dashboard", short: "D" },
    { key: "products", label: "Add Products", short: "A" },
    { key: "collections", label: "Collections", short: "C" },
    { key: "manage", label: "Products", short: "P" },
    { key: "analytics", label: "Analytics", short: "AN" },
    { key: "orders", label: "Orders", short: "O" },
    { key: "reports", label: "Reports", short: "R" },
    { key: "messages", label: "Messages", short: "M" },
    { key: "history", label: "Inventory History", short: "H" },
    { key: "settings", label: "Settings", short: "S" },
    { key: "users", label: "Users", short: "U" },
  ];

  const renderPresetSizeStockBox = ({
    title = "Size Stock",
    sizeRows = [],
    onChangeRow,
    onAddRow,
    onRemoveRow,
    compact = false,
  }) => {
    const currentSizeRows =
      Array.isArray(sizeRows) && sizeRows.length > 0
        ? sizeRows
        : [createEmptySizeRow()];

    return (
      <div className={`admin-size-stock-box dropdown ${compact ? "compact" : ""}`}>
        <p>{title}</p>

        {currentSizeRows.map((sizeRow, sizeIndex) => {
          const selectedType =
            sizeRow.size_type || getSizeTypeFromSize(sizeRow.size);
          const sizeOptions = getSizeOptionsByType(selectedType);

          return (
            <div className="admin-size-dropdown-row" key={sizeIndex}>
              <select
                value={selectedType}
                onChange={(e) =>
                  onChangeRow(sizeIndex, "size_type", e.target.value)
                }
              >
                <option value="">Product Type</option>
                {sizePresetGroups.map((group) => (
                  <option key={group.label} value={group.label}>
                    {group.label}
                  </option>
                ))}
              </select>

              <select
                value={sizeRow.size || ""}
                disabled={!selectedType}
                onChange={(e) =>
                  onChangeRow(sizeIndex, "size", e.target.value)
                }
              >
                <option value="">Size</option>
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                placeholder="Stock"
                value={sizeRow.stock || ""}
                onChange={(e) =>
                  onChangeRow(sizeIndex, "stock", e.target.value)
                }
              />

              <button
                type="button"
                className="remove-size-row-btn"
                onClick={() => onRemoveRow(sizeIndex)}
              >
                ×
              </button>
            </div>
          );
        })}

        <button
          type="button"
          className="add-size-row-btn"
          onClick={onAddRow}
        >
          + Add Size
        </button>
      </div>
    );
  };

  if (roleLoading) {
    return <div className="admin-loading">Loading admin access...</div>;
  }

  return (
    <section className={`admin-page ${isMobileMenuOpen ? "mobile-menu-open" : ""}`}>
      <div className="admin-mobile-topbar">
        <button
          className="admin-menu-toggle"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open admin menu"
        >
          Menu
        </button>

        <div>
          <h2>STREETBOIS ADMIN</h2>
          <p>{formattedDate}</p>
        </div>

        <button
          className="admin-notification-btn mobile"
          onClick={() => changeTab("orders")}
          aria-label="Open notifications"
        >
          !
          {notificationCount > 0 && <span>{notificationCount}</span>}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <aside className={`admin-sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="admin-sidebar-head">
          <h2>STREETBOIS ADMIN</h2>
          <button
            className="admin-close-menu"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close admin menu"
          >
            ×
          </button>
        </div>

        <div className="admin-profile-card">
          <div className="admin-profile-avatar">JA</div>
          <div>
            <h3>{adminName}</h3>
            <p>{adminRole === "super_admin" ? "Super Admin" : "Sales Admin"}</p>
          </div>
        </div>

        <nav className="admin-nav-list" aria-label="Admin sections">
          {adminNavItems
            .filter((item) => hasPermission(item.key))
            .map((item) => (
              <button
                key={item.key}
                className={activeTab === item.key ? "active" : ""}
                onClick={() => changeTab(item.key)}
              >
                <span className="admin-nav-dot">{item.short}</span>
                <span>{item.label}</span>
              </button>
            ))}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: "40px" }}>
          <button className="logout-btn sidebar-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar premium-topbar">
          <div>
            <h1>{pageTitles[activeTab] || "Dashboard"}</h1>
            <p>{pageSubtitles[activeTab] || "Welcome back, Admin."}</p>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-date-card premium-date-card">
              <strong>{formattedDate}</strong>
              <small>Date</small>
            </div>

            <button
              className="admin-notification-btn"
              onClick={() => changeTab("orders")}
              aria-label="Open notifications"
            >
              !
              {notificationCount > 0 && <span>{notificationCount}</span>}
            </button>
          </div>
        </div>

        {message && <div className="admin-message">{message}</div>}

        {activeTab === "dashboard" && hasPermission("dashboard") && (
          <div className="admin-dashboard premium-dashboard">
            <div className="dashboard-cards premium-stat-grid">
              <div className="dashboard-card premium-stat-card">
                <div className="stat-icon money">$</div>
                <div>
                  <h3>Total Revenue</h3>
                  <h1>GH₵ {totalRevenue.toFixed(0)}</h1>
                  <p className="stat-growth positive">+{Math.abs(growthCards[2].value).toFixed(1)}% from last month</p>
                </div>
              </div>

              <div className="dashboard-card premium-stat-card">
                <div className="stat-icon cart">🛒</div>
                <div>
                  <h3>Total Orders</h3>
                  <h1>{orders.length}</h1>
                  <p className="stat-growth positive">{pendingOrdersCount} pending orders</p>
                </div>
              </div>

              <div className="dashboard-card premium-stat-card">
                <div className="stat-icon box">📦</div>
                <div>
                  <h3>Total Products</h3>
                  <h1>{products.length}</h1>
                  <p className="stat-growth positive">{collections.length} collections</p>
                </div>
              </div>

              <div className="dashboard-card premium-stat-card">
                <div className="stat-icon alert">⚠</div>
                <div>
                  <h3>Low Stock Items</h3>
                  <h1>{restockProducts.length}</h1>
                  <p className="stat-link" onClick={() => changeTab("manage")}>View and restock</p>
                </div>
              </div>
            </div>

            <div className="premium-dashboard-grid">
              <div className="admin-card sales-overview-card">
                <div className="premium-card-header">
                  <h2>Sales Overview</h2>
                  <select className="mini-select" defaultValue="month">
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>

                <div className="line-chart-area">
                  <svg viewBox="0 0 600 260" preserveAspectRatio="none" className="sales-line-chart">
                    <defs>
                      <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4af37" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#d4af37" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <polyline
                      points={monthlyRevenueChart
                        .map((item, index) => {
                          const x = (index / Math.max(monthlyRevenueChart.length - 1, 1)) * 600;
                          const y = 230 - (item.revenue / maxMonthlyChartRevenue) * 185;
                          return `${x},${Math.max(35, y)}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#d4af37"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polygon
                      points={`0,245 ${monthlyRevenueChart
                        .map((item, index) => {
                          const x = (index / Math.max(monthlyRevenueChart.length - 1, 1)) * 600;
                          const y = 230 - (item.revenue / maxMonthlyChartRevenue) * 185;
                          return `${x},${Math.max(35, y)}`;
                        })
                        .join(" ")} 600,245`}
                      fill="url(#goldFill)"
                    />
                  </svg>

                  <div className="chart-labels">
                    {monthlyRevenueChart.map((item) => (
                      <span key={item.label}>{item.label}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="admin-card recent-orders-card">
                <div className="premium-card-header">
                  <h2>Recent Orders</h2>
                  <button onClick={() => changeTab("orders")}>View all</button>
                </div>

                {recentOrders.length === 0 ? (
                  <p>No orders yet.</p>
                ) : (
                  recentOrders.map((order) => (
                    <div className="premium-order-row" key={order.id}>
                      <div className="order-avatar">{(order.customer_name || "SB").slice(0, 2).toUpperCase()}</div>
                      <div className="order-name">
                        <h4>{order.customer_name}</h4>
                        <p>#{formatOrderReference(order)}</p>
                      </div>
                      <div className="order-total">
                        <strong>GH₵ {Number(order.total || 0).toFixed(0)}</strong>
                        <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="admin-card low-stock-showcase">
              <div className="premium-card-header">
                <h2>Low Stock Alerts</h2>
                <button onClick={() => changeTab("manage")}>View all</button>
              </div>

              <div className="low-stock-cards">
                {restockProducts.length === 0 ? (
                  <p>No low stock products.</p>
                ) : (
                  restockProducts.map((product) => (
                    <div className="low-stock-product" key={product.id}>
                      <div className="low-stock-image-frame">
                        <img src={product.image_url} alt={product.name} />
                      </div>

                      <div className="low-stock-info">
                        <h4>{product.name}</h4>
                        <p>{Number(product.stock || 0)} left</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && hasPermission("products") && (
          <div className="admin-card">

<div className="bulk-settings-box">
  <h3>Bulk Settings</h3>
  <p>Apply the same price, category, stock, sizes and description to all upload rows.</p>

  <div className="bulk-settings-grid">
    <input
  type="text"
  placeholder="Product Name"
  value={bulkSettings.name}
  onChange={(e) =>
    setBulkSettings({ ...bulkSettings, name: e.target.value })
  }
/>
    <input
      type="number"
      placeholder="Price"
      value={bulkSettings.price}
      onChange={(e) =>
        setBulkSettings({ ...bulkSettings, price: e.target.value })
      }
    />

    <select
      value={bulkSettings.category}
      onChange={(e) =>
        setBulkSettings({ ...bulkSettings, category: e.target.value })
      }
    >
      <option value="">Select Category</option>
      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>

    <input
      type="number"
      placeholder="Stock"
      value={bulkSettings.stock}
      onChange={(e) =>
        setBulkSettings({ ...bulkSettings, stock: e.target.value })
      }
    />

    {renderPresetSizeStockBox({
      title: "Bulk Size Stock",
      sizeRows: bulkSettings.size_stock,
      onChangeRow: handleBulkSizeStockChange,
      onAddRow: addBulkSizeStockRow,
      onRemoveRow: removeBulkSizeStockRow,
    })}

    <label className="bulk-checkbox">
      <input
        type="checkbox"
        checked={bulkSettings.featured}
        onChange={(e) =>
          setBulkSettings({ ...bulkSettings, featured: e.target.checked })
        }
      />
      Featured
    </label>
  </div>

  <textarea
    placeholder="Shared description"
    value={bulkSettings.description}
    onChange={(e) =>
      setBulkSettings({ ...bulkSettings, description: e.target.value })
    }
  ></textarea>

  <button
    className="apply-bulk-btn"
    onClick={() => {
      setRows((currentRows) =>
  currentRows.map((row) => ({
    ...row,
    name: bulkSettings.name || row.name,
    price: bulkSettings.price || row.price,
    category: bulkSettings.category || row.category,
    stock: bulkSettings.stock || row.stock,
    size_stock:
      sizeRowsToObject(bulkSettings.size_stock)
        ? bulkSettings.size_stock.map((sizeRow) => ({ ...sizeRow }))
        : row.size_stock,
    featured: bulkSettings.featured,
    description: bulkSettings.description || row.description,
  }))
);
    }}
  >
    Apply to All Products
  </button>
</div>


       <div className="multi-upload-box">
  <h3>Select Multiple Product Images</h3>
  <p>
    Choose many product images at once. A product row will be created
    automatically for each image.
  </p>

  <input
    type="file"
    accept="image/*"
    multiple
    onChange={(e) => handleMultipleImages(e.target.files)}
  />
</div>

            <h2>Bulk Upload Products</h2>

            <div className="admin-table-scroll">
              <table className="admin-product-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Preview</th>
                    <th>Image</th>
                    <th>Description</th>
                    <th>Stock</th>
                    <th>Sizes</th>
                    <th>Featured</th>
                    <th>Remove</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          value={row.name}
                          onChange={(e) =>
                            handleChange(index, "name", e.target.value)
                          }
                          placeholder="Product name"
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          value={row.price}
                          onChange={(e) =>
                            handleChange(index, "price", e.target.value)
                          }
                          placeholder="Price"
                        />
                      </td>

                      <td>
                        <select
                          value={row.category}
                          onChange={(e) =>
                            handleChange(index, "category", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
  {row.image_file ? (
    <img
      src={URL.createObjectURL(row.image_file)}
      alt="Preview"
      className="admin-preview-img"
    />
  ) : (
    <span>No image</span>
  )}
</td>

<td>
  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      handleChange(index, "image_file", e.target.files[0])
    }
  />
</td>

                      <td>
                        <input
                          value={row.description}
                          onChange={(e) =>
                            handleChange(index, "description", e.target.value)
                          }
                          placeholder="Description"
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          value={row.stock}
                          onChange={(e) =>
                            handleChange(index, "stock", e.target.value)
                          }
                          placeholder="Stock"
                        />
                      </td>

                      <td>
                        {renderPresetSizeStockBox({
                          title: "Sizes",
                          sizeRows: row.size_stock,
                          onChangeRow: (sizeIndex, field, value) =>
                            handleSizeStockChange(index, sizeIndex, field, value),
                          onAddRow: () => addSizeStockRow(index),
                          onRemoveRow: (sizeIndex) =>
                            removeSizeStockRow(index, sizeIndex),
                          compact: true,
                        })}
                      </td>

                      <td>
                        <input
                          type="checkbox"
                          checked={row.featured}
                          onChange={(e) =>
                            handleChange(index, "featured", e.target.checked)
                          }
                        />
                      </td>

                      <td>
                        <button
                          className="remove-row-btn"
                          onClick={() => removeRow(index)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-table-actions">
              <button onClick={addRow}>+ Add Row</button>
              <button onClick={uploadAllProducts} disabled={loading}>
                {loading ? "Uploading..." : "Upload Products"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "collections" && hasPermission("collections") && (
  <>
    <div className="admin-card collection-upload-card">
      <div className="collection-upload-header">
        <div>
          <h2>Add Explore Collection</h2>
          <p>Create a collection that will appear on the home page.</p>
        </div>
      </div>

      <div className="collection-upload-form">
        <div className="collection-field">
          <label>Collection Name</label>
          <input
            type="text"
            value={collectionForm.name}
            onChange={(e) =>
              setCollectionForm({
                ...collectionForm,
                name: e.target.value,
              })
            }
            placeholder="e.g. Sneakers"
          />
        </div>

        <div className="collection-field">
          <label>Collection Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setCollectionForm({
                ...collectionForm,
                image_file: e.target.files[0],
              })
            }
          />
        </div>

        <button
          className="collection-upload-btn"
          onClick={uploadCollection}
          disabled={collectionLoading}
        >
          {collectionLoading ? "Uploading..." : "Upload Collection"}
        </button>
      </div>
    </div>

    <div className="admin-card">
      <h2>Uploaded Collections</h2>

      <div className="collection-list">
        {collections.length === 0 ? (
          <p className="admin-muted-text">No collections uploaded yet.</p>
        ) : (
          collections.map((collection) => (
            <div className="collection-item-card" key={collection.id}>
              <img
                src={collection.image_url}
                alt={collection.name}
                className="collection-item-image"
              />

              <div className="collection-item-content">
                <h3>{collection.name}</h3>
                <p>
                  {collection.created_at
                    ? new Date(collection.created_at).toLocaleString()
                    : "No date"}
                </p>
              </div>

              <button
                className="remove-row-btn"
                onClick={() => deleteCollection(collection.id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  </>
)}

        {activeTab === "manage" && hasPermission("manage") && (
          <div className="admin-card">
            <h2>Manage Products</h2>

            <div className="admin-filter-row">
              <div className="admin-search-box">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="admin-category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                className="admin-category-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="stock-low">Stock: Low to High</option>
                <option value="stock-high">Stock: High to Low</option>
              </select>
            </div>

            <div className="bulk-actions-bar">
              <button onClick={selectAllCurrentPage}>Select Page</button>

              <button
                className="bulk-delete-btn"
                onClick={bulkDeleteProducts}
                disabled={bulkDeleteLoading}
              >
                {bulkDeleteLoading
                  ? "Deleting..."
                  : `Delete Selected (${selectedProducts.length})`}
              </button>

              <p>
                Showing {paginatedProducts.length} of {sortedProducts.length}{" "}
                products
              </p>
            </div>

            <div className="admin-table-scroll">
              <table className="admin-product-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Sizes</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Preview</th>
                    <th>Edit</th>
                    <th>Delete</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleSelectProduct(product.id)}
                        />
                      </td>

                      <td>
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="admin-preview-img"
                        />
                      </td>

                      <td>{product.name}</td>
                      <td>GH₵ {product.price}</td>
                      <td>{product.category}</td>
                      <td>{formatSizeStockForDisplay(product.size_stock, product.sizes)}</td>
                      <td>
                        <div className="shared-stock-cell">
                          <strong>{product.shared_stock || 0}</strong>
                          {product.variant_count > 1 && (
                            <small>Shared across {product.variant_count} variants</small>
                          )}
                        </div>
                      </td>
                      <td>{getStockBadge(product.shared_stock)}</td>

                      <td>
                        <button
                          className={
                            product.featured
                              ? "featured-badge active"
                              : "featured-badge inactive"
                          }
                          onClick={() => toggleFeatured(product)}
                        >
                          {product.featured ? "★ Featured" : "• Normal"}
                        </button>
                      </td>

                      <td>
                        <button
                          className="preview-row-btn"
                          onClick={() => setPreviewProduct(product)}
                        >
                          👁 Preview
                        </button>
                      </td>

                      <td>
                        <button
                          className="edit-row-btn"
                          onClick={() => startEditProduct(product)}
                        >
                          ✏ Edit
                        </button>
                      </td>

                      <td>
                        <button
                          className="remove-row-btn"
                          onClick={() => deleteProduct(product.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {paginatedProducts.length === 0 && (
                    <tr>
                      <td colSpan="12">No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination-controls">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {activeTab === "analytics" && hasPermission("analytics") && (
          <div className="advanced-analytics-page">
            <div className="admin-card analytics-hero-card">
              <div>
                <span>Roadmap 6</span>
                <h2>Advanced Sales Analytics</h2>
                <p className="admin-muted-text">
                  Live executive insights for revenue, orders, customers, products and inventory.
                </p>
              </div>

              <div className="analytics-hero-mini">
                <div>
                  <small>Total Revenue</small>
                  <strong>GH₵ {totalRevenue.toFixed(2)}</strong>
                </div>
                <div>
                  <small>Total Orders</small>
                  <strong>{activeOrders.length}</strong>
                </div>
              </div>
            </div>

            <div className="admin-card analytics-control-panel">
              <div className="analytics-date-fields">
                <label>
                  Start Date
                  <input
                    type="date"
                    value={analyticsStartDate}
                    onChange={(e) => {
                      setAnalyticsStartDate(e.target.value);
                      setAnalyticsQuickRange("Custom");
                    }}
                  />
                </label>

                <label>
                  End Date
                  <input
                    type="date"
                    value={analyticsEndDate}
                    onChange={(e) => {
                      setAnalyticsEndDate(e.target.value);
                      setAnalyticsQuickRange("Custom");
                    }}
                  />
                </label>
              </div>

              <div className="analytics-range-buttons">
                {["Today", "7 Days", "30 Days", "This Month", "All Time"].map((range) => (
                  <button
                    key={range}
                    className={analyticsQuickRange === range ? "active" : ""}
                    onClick={() => applyAnalyticsRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>

              <div className="analytics-export-buttons">
                <button onClick={exportAnalyticsCSV}>Export Analytics CSV</button>
                <button onClick={exportAnalyticsPDF}>Export Analytics PDF</button>
              </div>
            </div>

            <div className="analytics-kpi-grid">
              {analyticsKpis.map((card) => (
                <div className="analytics-kpi-card" key={card.title}>
                  <div className="analytics-kpi-top">
                    <h3>{card.title}</h3>
                    <span className={Number(card.trend) >= 0 ? "kpi-trend up" : "kpi-trend down"}>
                      {Number(card.trend) >= 0 ? "↑" : "↓"} {Math.abs(Number(card.trend || 0)).toFixed(1)}%
                    </span>
                  </div>
                  <h1>{card.value}</h1>
                  <p>{card.note}</p>
{card.title === "Inventory Value" && (
  <button
    type="button"
    className="inventory-breakdown-btn"
    onClick={() => setShowInventoryBreakdown(true)}
  >
    View Breakdown
  </button>
)}

                </div>
              ))}
            </div>

            <div className="analytics-pro-grid">
              <div className="admin-card analytics-pro-card wide">
                <div className="analytics-card-header">
                  <div>
                    <span>7-Day Performance</span>
                    <h2>Daily Revenue Trend</h2>
                  </div>
                  <strong>GH₵ {weeklyRevenue.toFixed(2)}</strong>
                </div>

                <div className="pro-bar-chart tall">
                  {dailySalesTrend.map((item) => (
                    <div className="pro-bar-item" key={item.label}>
                      <div className="pro-bar-track">
                        <div
                          className="pro-bar-fill"
                          style={{ height: `${Math.max((item.revenue / maxDailyRevenue) * 100, item.revenue > 0 ? 8 : 2)}%` }}
                        ></div>
                      </div>
                      <span>{item.label}</span>
                      <small>GH₵ {item.revenue.toFixed(0)}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card analytics-pro-card">
                <div className="analytics-card-header">
                  <div>
                    <span>Today</span>
                    <h2>Hourly Sales</h2>
                  </div>
                </div>

                <div className="mini-hourly-chart">
                  {hourlySalesTrend.map((item) => (
                    <div className="mini-hour-row" key={item.label}>
                      <span>{item.label}</span>
                      <div>
                        <b style={{ width: `${Math.max((item.revenue / maxHourlyRevenue) * 100, item.revenue > 0 ? 6 : 2)}%` }}></b>
                      </div>
                      <small>GH₵ {item.revenue.toFixed(0)}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="analytics-pro-grid three">
              <div className="admin-card analytics-pro-card">
                <div className="analytics-card-header">
                  <div>
                    <span>Products</span>
                    <h2>Best Sellers</h2>
                  </div>
                </div>

                {bestSellers.length === 0 ? (
                  <p>No sales data yet.</p>
                ) : (
                  bestSellers.map((item, index) => (
                    <div className="analytics-rank-row" key={item.name}>
                      <strong>#{index + 1}</strong>
                      {item.image_url && <img src={item.image_url} alt={item.name} />}
                      <div>
                        <h4>{item.name}</h4>
                        <p>{item.quantity} sold · GH₵ {Number(item.revenue || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-card analytics-pro-card">
                <div className="analytics-card-header">
                  <div>
                    <span>Reviews</span>
                    <h2>Top Rated</h2>
                  </div>
                </div>

                {topRatedProducts.length === 0 ? (
                  <p>No product reviews yet.</p>
                ) : (
                  topRatedProducts.map((product, index) => (
                    <div className="analytics-rank-row" key={product.id}>
                      <strong>#{index + 1}</strong>
                      <img src={product.image_url} alt={product.name} />
                      <div>
                        <h4>{product.name}</h4>
                        <p>⭐ {product.average_rating.toFixed(1)} · {product.review_count} reviews</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-card analytics-pro-card">
                <div className="analytics-card-header">
                  <div>
                    <span>Velocity</span>
                    <h2>Fastest Selling</h2>
                  </div>
                </div>

                {fastestSellingProducts.length === 0 ? (
                  <p>No product velocity yet.</p>
                ) : (
                  fastestSellingProducts.map((item, index) => (
                    <div className="analytics-rank-row" key={item.name}>
                      <strong>#{index + 1}</strong>
                      {item.image_url && <img src={item.image_url} alt={item.name} />}
                      <div>
                        <h4>{item.name}</h4>
                        <p>{item.sales_velocity.toFixed(2)} sales/day</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="analytics-pro-grid two">
              <div className="admin-card analytics-pro-card">
                <div className="analytics-card-header">
                  <div>
                    <span>Engagement</span>
                    <h2>Most Viewed Products</h2>
                  </div>
                </div>

                {mostViewedProducts.length === 0 ? (
                  <p>No product view data yet. Run the SQL and connect storefront tracking.</p>
                ) : (
                  mostViewedProducts.map((product, index) => (
                    <div className="analytics-rank-row" key={product.id}>
                      <strong>#{index + 1}</strong>
                      <img src={product.image_url} alt={product.name} />
                      <div>
                        <h4>{product.name}</h4>
                        <p>{product.views} views</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-card analytics-pro-card">
                <div className="analytics-card-header">
                  <div>
                    <span>Wishlist</span>
                    <h2>Most Wishlisted Products</h2>
                  </div>
                </div>

                {mostWishlistedProducts.length === 0 ? (
                  <p>No wishlist analytics yet. Run the SQL and connect wishlist tracking.</p>
                ) : (
                  mostWishlistedProducts.map((product, index) => (
                    <div className="analytics-rank-row" key={product.id}>
                      <strong>#{index + 1}</strong>
                      <img src={product.image_url} alt={product.name} />
                      <div>
                        <h4>{product.name}</h4>
                        <p>{product.wishlist_count} wishlist saves</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="analytics-pro-grid three">
              <div className="admin-card analytics-pro-card">
                <div className="analytics-card-header">
                  <div>
                    <span>Category</span>
                    <h2>Category Performance</h2>
                  </div>
                </div>

                {topSellingCategories.length === 0 ? (
                  <p>No category sales yet.</p>
                ) : (
                  topSellingCategories.map((item) => (
                    <div className="category-progress-item premium-category" key={item.category}>
                      <div className="category-progress-top">
                        <span>{item.category}</span>
                        <strong>{item.percentage.toFixed(0)}%</strong>
                      </div>
                      <div className="category-progress-track">
                        <div className="category-progress-fill" style={{ width: `${item.percentage}%` }}></div>
                      </div>
                      <small>{item.quantity} sold · GH₵ {item.revenue.toFixed(2)}</small>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-card analytics-pro-card">
                <div className="analytics-card-header">
                  <div>
                    <span>Inventory</span>
                    <h2>Slow Moving Stock</h2>
                  </div>
                </div>

                {slowMovingInventory.length === 0 ? (
                  <p>No slow stock data yet.</p>
                ) : (
                  slowMovingInventory.map((product) => (
                    <div className="analytics-rank-row" key={product.id}>
                      <strong>{product.sold}</strong>
                      <img src={product.image_url} alt={product.name} />
                      <div>
                        <h4>{product.name}</h4>
                        <p>{product.stock} in stock · GH₵ {product.stock_value.toFixed(2)} value</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-card analytics-pro-card">
                <div className="analytics-card-header">
                  <div>
                    <span>Customers</span>
                    <h2>Customer Insights</h2>
                  </div>
                </div>

                <div className="customer-insight-list">
                  <div><span>Total Customers</span><strong>{Object.keys(customerOrderCount).length}</strong></div>
                  <div><span>Returning Customers</span><strong>{returningCustomers}</strong></div>
                  <div><span>Average Order Value</span><strong>GH₵ {averageOrderValue.toFixed(2)}</strong></div>
                  <div><span>Delivered Orders</span><strong>{completedOrders}</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && hasPermission("reports") && (
          <div className="reports-page">
            <div className="admin-card reports-summary-card">
              <h2>Reports Center</h2>
              <p>
                Export business reports for products, orders and sales records.
                CSV is best for spreadsheets. PDF is best for sharing and printing.
              </p>
            </div>

            <div className="reports-grid">
              <div className="report-card">
                <div>
                  <h3>📦 Product Reports</h3>
                  <p>Export product inventory including category, price, stock and featured status.</p>
                </div>

                <div className="report-actions">
                  <button onClick={exportProductsCSV}>Export CSV</button>
                  <button onClick={exportProductsPDF}>Export PDF</button>
                </div>
              </div>

              <div className="report-card">
                <div>
                  <h3>📋 Order Reports</h3>
                  <p>Export customer orders including customer details, totals, status and dates.</p>
                </div>

                <div className="report-actions">
                  <button onClick={exportOrdersCSV}>Export CSV</button>
                  <button onClick={exportOrdersPDF}>Export PDF</button>
                </div>
              </div>
            </div>

            <div className="dashboard-cards reports-stat-cards">
              <div className="dashboard-card">
                <h3>Total Revenue</h3>
                <h1>GH₵ {totalRevenue.toFixed(2)}</h1>
              </div>

              <div className="dashboard-card">
                <h3>Total Orders</h3>
                <h1>{orders.length}</h1>
              </div>

              <div className="dashboard-card">
                <h3>Total Products</h3>
                <h1>{products.length}</h1>
              </div>

              <div className="dashboard-card">
                <h3>Returning Customers</h3>
                <h1>{returningCustomers}</h1>
              </div>
            </div>
          </div>
        )}

         {activeTab === "orders" && hasPermission("orders") && (
  <div className="admin-card">
    <h2>Orders</h2>

    <div className="admin-filter-row">
      <select
        className="admin-category-filter"
        value={orderFilter}
        onChange={(e) => setOrderFilter(e.target.value)}
      >
        <option value="All">All Orders</option>
        <option value="Pending">Pending</option>
        <option value="Processing">Processing</option>
        <option value="Delivered">Delivered</option>
        <option value="Cancelled">Cancelled</option>
      </select>
    </div>

    <div className="admin-table-scroll">
      <table className="admin-product-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>View</th>
          </tr>
        </thead>

        <tbody>
          {orders
            .filter((order) =>
              orderFilter === "All" ? true : order.status === orderFilter
            )
            .map((order) => (
              <tr key={order.id}>
                <td>{formatOrderReference(order)}</td>
                <td>{order.customer_name}</td>
                <td>{order.customer_phone}</td>
                <td>GH₵ {order.total}</td>
                <td>
                  <span className={`order-status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td>
                  <button
                    className="preview-row-btn"
                    onClick={() => setSelectedOrder(order)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
)}

        {activeTab === "messages" && hasPermission("messages") && (
          <div className="messages-page">
            <div className="admin-card messages-header-card">
              <div>
                <h2>Customer Messages</h2>
                <p className="admin-muted-text">
                  View, read and manage messages sent from the Contact page.
                </p>
              </div>

              <div className="messages-header-stats">
                <div>
                  <span>Total</span>
                  <strong>{contactMessages.length}</strong>
                </div>
                <div>
                  <span>Unread</span>
                  <strong>{unreadMessagesCount}</strong>
                </div>
                <div>
                  <span>Read</span>
                  <strong>{contactMessages.length - unreadMessagesCount}</strong>
                </div>
              </div>
            </div>

            <div className="admin-card messages-tools-card">
              <div className="admin-filter-row messages-filter-row">
                <div className="admin-search-box">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, subject or message..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                  />
                </div>

                <select
                  className="admin-category-filter"
                  value={messageFilter}
                  onChange={(e) => setMessageFilter(e.target.value)}
                >
                  <option value="All">All Messages</option>
                  <option value="Unread">Unread</option>
                  <option value="Read">Read</option>
                </select>
              </div>
            </div>

            <div className="admin-card messages-list-card">
              {filteredContactMessages.length === 0 ? (
                <div className="empty-state-card">
                  <h3>💬 No messages found</h3>
                  <p>
                    Customer messages from the Contact page will appear here after submission.
                  </p>
                </div>
              ) : (
                <div className="messages-list">
                  {filteredContactMessages.map((item) => (
                    <div
                      className={
                        item.is_read
                          ? "message-card"
                          : "message-card unread"
                      }
                      key={item.id}
                    >
                      <div className="message-avatar">
                        {(item.name || "SB").slice(0, 2).toUpperCase()}
                      </div>

                      <div className="message-main">
                        <div className="message-card-top">
                          <div>
                            <h3>{item.name}</h3>
                            <p>
                              {item.email} {item.phone ? `• ${item.phone}` : ""}
                            </p>
                          </div>

                          <span className={item.is_read ? "message-status read" : "message-status unread"}>
                            {item.is_read ? "Read" : "Unread"}
                          </span>
                        </div>

                        <h4>{item.subject}</h4>
                        <p className="message-preview">{item.message}</p>

                        <div className="message-meta-row">
                          <small>{new Date(item.created_at).toLocaleString()}</small>

                          <div className="message-actions">
                            <button
                              className="preview-row-btn"
                              onClick={() => {
                                setSelectedMessage(item);
                                if (!item.is_read) {
                                  markMessageAsRead(item.id, true);
                                }
                              }}
                            >
                              View
                            </button>

                            <button
                              className="edit-row-btn"
                              onClick={() => markMessageAsRead(item.id, !item.is_read)}
                            >
                              {item.is_read ? "Mark Unread" : "Mark Read"}
                            </button>

                            <button
                              className="remove-row-btn"
                              onClick={() => deleteContactMessage(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && hasPermission("history") && (
          <div className="inventory-history-page">
            <div className="admin-card inventory-history-header">
              <div>
                <h2>Inventory History</h2>
                <p className="admin-muted-text">
                  Track every product stock movement from the admin dashboard.
                </p>
              </div>

              <div className="inventory-history-stats">
                <div>
                  <span>Total Records</span>
                  <strong>{inventoryHistory.length}</strong>
                </div>
                <div>
                  <span>Stock Increases</span>
                  <strong>{totalStockIncreases}</strong>
                </div>
                <div>
                  <span>Stock Reductions</span>
                  <strong>{totalStockReductions}</strong>
                </div>
              </div>
            </div>

            <div className="admin-card inventory-history-tools">
              <div className="admin-filter-row messages-filter-row">
                <div className="admin-search-box">
                  <input
                    type="text"
                    placeholder="Search product, reason or admin..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                </div>

                <select
                  className="admin-category-filter"
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                >
                  <option value="All">All Actions</option>
                  <option value="Stock Update">Stock Update</option>
                  <option value="New Product">New Product</option>
                  <option value="Bulk Update">Bulk Update</option>
                </select>

                <button className="preview-row-btn" onClick={fetchInventoryHistory}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="admin-card inventory-history-list-card">
              {filteredInventoryHistory.length === 0 ? (
                <div className="empty-state-card">
                  <h3>📦 No inventory history yet</h3>
                  <p>Stock updates will appear here after you edit product stock.</p>
                </div>
              ) : (
                <div className="inventory-history-list">
                  {filteredInventoryHistory.map((item) => (
                    <div className="inventory-history-item" key={item.id}>
                      <div className="history-icon">📦</div>

                      <div className="history-main">
                        <div className="history-top-row">
                          <div>
                            <h3>{item.product_name}</h3>
                            <p>{item.reason || "Manual admin update"}</p>
                          </div>

                          <span
                            className={
                              Number(item.quantity_changed || 0) >= 0
                                ? "history-change increase"
                                : "history-change decrease"
                            }
                          >
                            {Number(item.quantity_changed || 0) >= 0 ? "+" : ""}
                            {item.quantity_changed}
                          </span>
                        </div>

                        <div className="history-stock-row">
                          <span>Old Stock: <strong>{item.old_stock}</strong></span>
                          <span>→</span>
                          <span>New Stock: <strong>{item.new_stock}</strong></span>
                        </div>

                        <div className="history-meta-row">
                          <small>{item.action_type || "Stock Update"}</small>
                          <small>Changed by {item.changed_by || "Administrator"}</small>
                          <small>{new Date(item.created_at).toLocaleString()}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && hasPermission("settings") && (
          <div className="settings-page advanced-settings-page">
            <div className="admin-card settings-hero-card">
              <div>
                <span>Store Management Center</span>
                <h2>{settings.store_name || "StreetBois Fashion"}</h2>
                <p className="admin-muted-text">
                  Update your store identity, contact details, delivery rules,
                  business hours and social media links from one place.
                </p>
              </div>

              <div className="settings-status-card">
                <small>Last Updated</small>
                <strong>
                  {settings.updated_at
                    ? new Date(settings.updated_at).toLocaleString()
                    : "Not saved yet"}
                </strong>
              </div>
            </div>

            {settingsLoading ? (
              <div className="admin-card">Loading store settings...</div>
            ) : (
              <>
                <div className="settings-section-grid">
                  <div className="admin-card settings-card">
                    <div className="settings-section-title">
                      <span>🏪</span>
                      <div>
                        <h2>Store Information</h2>
                        <p>Basic public information about your business.</p>
                      </div>
                    </div>

                    <div className="settings-grid">
                      <label>
                        Store Name
                        <input
                          value={settings.store_name || ""}
                          onChange={(e) =>
                            updateSettingsField("store_name", e.target.value)
                          }
                        />
                      </label>

                      <label>
                        Location Name
                        <input
                          value={settings.location_name || ""}
                          onChange={(e) =>
                            updateSettingsField("location_name", e.target.value)
                          }
                          placeholder="e.g. Tudu, Accra"
                        />
                      </label>

                      <label>
                        Business Hours
                        <input
                          value={settings.business_hours || ""}
                          onChange={(e) =>
                            updateSettingsField("business_hours", e.target.value)
                          }
                        />
                      </label>
                    </div>

                    <div className="settings-logo-panel">
                      <div className="settings-logo-preview">
                        {settings.logo_url ? (
                          <img src={settings.logo_url} alt="Brand logo preview" />
                        ) : (
                          <span>SB</span>
                        )}
                      </div>

                      <label>
                        Brand Logo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => uploadBrandLogo(e.target.files?.[0])}
                        />
                        <small>
                          {settingsLogoUploading
                            ? "Uploading logo..."
                            : "Upload a square logo or paste a logo URL below."}
                        </small>
                      </label>
                    </div>

                    <label className="settings-full-label">
                      Brand Logo URL
                      <input
                        value={settings.logo_url || ""}
                        onChange={(e) =>
                          updateSettingsField("logo_url", e.target.value)
                        }
                        placeholder="Paste image URL here if upload is blocked"
                      />
                    </label>

                    <label className="settings-full-label">
                      Store Address
                      <textarea
                        value={settings.address || ""}
                        onChange={(e) =>
                          updateSettingsField("address", e.target.value)
                        }
                      ></textarea>
                    </label>

                    <label className="settings-full-label">
                      About Store
                      <textarea
                        value={settings.about || ""}
                        onChange={(e) =>
                          updateSettingsField("about", e.target.value)
                        }
                      ></textarea>
                    </label>
                  </div>

                  <div className="admin-card settings-card">
                    <div className="settings-section-title">
                      <span>📞</span>
                      <div>
                        <h2>Contact Details</h2>
                        <p>Used on Contact page, customer support and checkout.</p>
                      </div>
                    </div>

                    <div className="settings-grid">
                      <label>
                        Phone Number
                        <input
                          value={settings.phone || ""}
                          onChange={(e) =>
                            updateSettingsField("phone", e.target.value)
                          }
                        />
                      </label>

                      <label>
                        WhatsApp Number
                        <input
                          value={settings.whatsapp || ""}
                          onChange={(e) =>
                            updateSettingsField("whatsapp", e.target.value)
                          }
                        />
                      </label>

                      <label>
                        General Sales WhatsApp Numbers
                        <input
                          value={settings.sales_whatsapp || ""}
                          onChange={(e) =>
                            updateSettingsField("sales_whatsapp", e.target.value)
                          }
                          placeholder="Up to 3 numbers, separated by commas"
                        />
                      </label>

                      <label>
                        Menswear Shop WhatsApp Numbers
                        <textarea
                          value={settings.mens_wear_sales_whatsapp || ""}
                          onChange={(e) =>
                            updateSettingsField(
                              "mens_wear_sales_whatsapp",
                              e.target.value
                            )
                          }
                          placeholder="Enter up to 3 numbers, one per line or separated by commas"
                        ></textarea>
                      </label>

                      <label>
                        Sneakers Shop WhatsApp Numbers
                        <textarea
                          value={settings.sneakers_sales_whatsapp || ""}
                          onChange={(e) =>
                            updateSettingsField(
                              "sneakers_sales_whatsapp",
                              e.target.value
                            )
                          }
                          placeholder="Enter up to 3 numbers, one per line or separated by commas"
                        ></textarea>
                      </label>

                      <label>
                        Email Address
                        <input
                          type="email"
                          value={settings.email || ""}
                          onChange={(e) =>
                            updateSettingsField("email", e.target.value)
                          }
                        />
                      </label>

                      <label>
                        Currency
                        <input
                          value={settings.currency || ""}
                          onChange={(e) =>
                            updateSettingsField("currency", e.target.value)
                          }
                          placeholder="GH₵"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="settings-section-grid">
                  <div className="admin-card settings-card">
                    <div className="settings-section-title">
                      <span>🚚</span>
                      <div>
                        <h2>Delivery & Payments</h2>
                        <p>Configure delivery fee, free delivery and VAT.</p>
                      </div>
                    </div>

                    <div className="settings-grid">
                      <label>
                        Delivery Fee
                        <input
                          type="number"
                          value={settings.delivery_fee ?? ""}
                          onChange={(e) =>
                            updateSettingsField("delivery_fee", e.target.value)
                          }
                          placeholder="0"
                        />
                      </label>

                      <label>
                        Free Shipping Threshold
                        <input
                          type="number"
                          value={settings.free_shipping_threshold ?? ""}
                          onChange={(e) =>
                            updateSettingsField(
                              "free_shipping_threshold",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 500"
                        />
                      </label>

                      <label>
                        Tax / VAT Percentage
                        <input
                          type="number"
                          value={settings.tax_percentage ?? ""}
                          onChange={(e) =>
                            updateSettingsField("tax_percentage", e.target.value)
                          }
                          placeholder="0"
                        />
                      </label>
                    </div>

                    <label className="settings-full-label">
                      Delivery Note
                      <textarea
                        value={settings.delivery_note || ""}
                        onChange={(e) =>
                          updateSettingsField("delivery_note", e.target.value)
                        }
                      ></textarea>
                    </label>
                  </div>

                  <div className="admin-card settings-card">
                    <div className="settings-section-title">
                      <span>🌐</span>
                      <div>
                        <h2>Social Media & Map</h2>
                        <p>Add your official social pages and Google Map link.</p>
                      </div>
                    </div>

                    <div className="settings-grid">
                      <label>
                        Facebook URL
                        <input
                          value={settings.facebook || ""}
                          onChange={(e) =>
                            updateSettingsField("facebook", e.target.value)
                          }
                        />
                      </label>

                      <label>
                        Instagram URL
                        <input
                          value={settings.instagram || ""}
                          onChange={(e) =>
                            updateSettingsField("instagram", e.target.value)
                          }
                        />
                      </label>

                      <label>
                        TikTok URL
                        <input
                          value={settings.tiktok || ""}
                          onChange={(e) =>
                            updateSettingsField("tiktok", e.target.value)
                          }
                        />
                      </label>

                      <label>
                        X / Twitter URL
                        <input
                          value={settings.twitter || ""}
                          onChange={(e) =>
                            updateSettingsField("twitter", e.target.value)
                          }
                        />
                      </label>
                    </div>

                    <label className="settings-full-label">
                      Google Maps Link or Embed URL
                      <textarea
                        value={settings.google_map || ""}
                        onChange={(e) =>
                          updateSettingsField("google_map", e.target.value)
                        }
                        placeholder="Paste Google Maps link here"
                      ></textarea>
                    </label>
                  </div>
                </div>

                <div className="admin-card settings-save-panel">
                  <div>
                    <h2>Save Store Settings</h2>
                    <p>
                      Changes are saved to Supabase and can be used across your
                      website pages.
                    </p>
                  </div>

                  <div className="settings-save-actions">
                    <button
                      className="settings-secondary-btn"
                      onClick={fetchStoreSettings}
                      disabled={settingsSaving}
                    >
                      Reset
                    </button>

                    <button
                      className="save-settings-btn"
                      onClick={saveSettings}
                      disabled={settingsSaving}
                    >
                      {settingsSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "users" && hasPermission("users") && (
          <AdminUsersManager
  adminUsers={adminUsers}
  fetchAdminUsers={fetchAdminUsers}
  profiles={profiles}
  setMessage={setMessage}
/>
        )}

        {editingProduct && (
          <div className="modal-overlay">
            <div className="product-modal">
              <button
                className="close-modal"
                onClick={() => setEditingProduct(null)}
              >
                ×
              </button>

              <div className="modal-details">
                <h2>Edit Product</h2>

                <div className="edit-image-preview">
                  <p>Current Product Image</p>
                  <img
                    src={
                      editingProduct.new_image
                        ? URL.createObjectURL(editingProduct.new_image)
                        : editingProduct.image_url
                    }
                    alt={editingProduct.name}
                  />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      new_image: e.target.files[0],
                    })
                  }
                />

                <input
                  type="text"
                  placeholder="Product Name"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Price"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: e.target.value,
                    })
                  }
                />

                <select
                  value={editingProduct.category}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      category: e.target.value,
                    })
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>

                <textarea
                  placeholder="Description"
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Fallback stock for products without sizes"
                  value={editingProduct.stock}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      stock: e.target.value,
                    })
                  }
                />

                {renderPresetSizeStockBox({
                  title: "Size Stock",
                  sizeRows: editingProduct.size_stock,
                  onChangeRow: handleEditingSizeStockChange,
                  onAddRow: addEditingSizeStockRow,
                  onRemoveRow: removeEditingSizeStockRow,
                })}

                <input
                  type="text"
                  placeholder="Stock update reason"
                  value={editingProduct.stock_reason || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      stock_reason: e.target.value,
                    })
                  }
                />

                <label style={{ marginTop: "15px" }}>
                  <input
                    type="checkbox"
                    checked={editingProduct.featured}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        featured: e.target.checked,
                      })
                    }
                  />{" "}
                  Featured Product
                </label>

                <button
                  className="upload-all-btn"
                  style={{ marginTop: "25px" }}
                  onClick={updateProduct}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {previewProduct && (
          <div className="modal-overlay">
            <div className="product-modal">
              <button
                className="close-modal"
                onClick={() => setPreviewProduct(null)}
              >
                ×
              </button>

              <img
                src={previewProduct.image_url}
                alt={previewProduct.name}
                className="modal-product-img"
              />

              <div className="modal-details">
                <h2>{previewProduct.name}</h2>
                <h3>GH₵ {previewProduct.price}</h3>
                <p>{previewProduct.category}</p>
                <p>{previewProduct.description}</p>
                <p>Stock: {previewProduct.stock || 0}</p>
                <p>
                  Sizes:{" "}
                  {formatSizeStockForDisplay(
                    previewProduct.size_stock,
                    previewProduct.sizes
                  )}
                </p>
                <p>{previewProduct.featured ? "Featured" : "Normal Product"}</p>
              </div>
            </div>
          </div>
        )}


        {selectedMessage && (
          <div className="modal-overlay">
            <div className="message-modal">
              <button
                className="close-modal"
                onClick={() => setSelectedMessage(null)}
              >
                ×
              </button>

              <div className="message-modal-body">
                <span className={selectedMessage.is_read ? "message-status read" : "message-status unread"}>
                  {selectedMessage.is_read ? "Read" : "Unread"}
                </span>

                <h2>{selectedMessage.subject}</h2>

                <div className="message-modal-details">
                  <p><strong>Name:</strong> {selectedMessage.name}</p>
                  <p><strong>Email:</strong> {selectedMessage.email}</p>
                  <p><strong>Phone:</strong> {selectedMessage.phone || "N/A"}</p>
                  <p><strong>Date:</strong> {new Date(selectedMessage.created_at).toLocaleString()}</p>
                </div>

                <div className="message-modal-content">
                  <h3>Message</h3>
                  <p>{selectedMessage.message}</p>
                </div>

                <div className="message-modal-actions">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || "StreetBois Fashion")}`}
                  >
                    Reply by Email
                  </a>

                  {selectedMessage.phone && (
                    <a
                      href={`https://wa.me/${selectedMessage.phone.replace(/\D/g, "").replace(/^0/, "233")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Reply on WhatsApp
                    </a>
                  )}

                  <button
                    className="remove-row-btn"
                    onClick={() => deleteContactMessage(selectedMessage.id)}
                  >
                    Delete Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedOrder && (
  <div className="modal-overlay">
    <div className="product-modal">
      <button className="close-modal" onClick={() => setSelectedOrder(null)}>
        ×
      </button>

      <div className="modal-details">
        <h2>Order Details</h2>

        <p><strong>Order ID:</strong> {formatOrderReference(selectedOrder)}</p>
        <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
        <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
        <p><strong>Email:</strong> {selectedOrder.customer_email || "N/A"}</p>
        <p><strong>Address:</strong> {selectedOrder.delivery_address}</p>
        <p><strong>Total:</strong> GH₵ {selectedOrder.total}</p>

        <h3>Items</h3>

        {selectedOrder.items.map((item, index) => (
          <div className="order-item" key={index}>
            <img src={item.image_url} alt={item.name} />
            <div>
              <h4>{item.name}</h4>
              <p>Qty: {item.quantity}</p>
              <p>Subtotal: GH₵ {item.subtotal}</p>
            </div>
          </div>
        ))}

        <select
          value={selectedOrder.status}
          onChange={(e) =>
            updateOrderStatus(selectedOrder.id, e.target.value)
          }
        >
          <option>Pending</option>
          <option>Processing</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
      </div>
    </div>
  </div>
)}

{showInventoryBreakdown && (
  <div className="inventory-modal-overlay">
    <div className="inventory-modal">
      <div className="inventory-modal-head">
        <div>
          <h2>Inventory Value Breakdown</h2>
          <p>
            Total Products: {products.length} · Total Units: {totalInventoryUnits} ·
            Total Value: GH₵ {inventoryValue.toFixed(2)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInventoryBreakdown(false)}
        >
          ×
        </button>
      </div>

      <div className="admin-table-scroll">
        <table className="admin-product-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Value</th>
            </tr>
          </thead>

          <tbody>
            {inventoryBreakdown.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="inventory-product-cell">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} />
                    )}
                    <span>{item.name}</span>
                  </div>
                </td>

                <td>{item.category}</td>
                <td>GH₵ {item.price.toFixed(2)}</td>
                <td>{item.stock}</td>
                <td>GH₵ {item.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan="3">
                <strong>Total</strong>
              </td>
              <td>
                <strong>{totalInventoryUnits}</strong>
              </td>
              <td>
                <strong>GH₵ {inventoryValue.toFixed(2)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
)}

      </main>
    </section>
  );
}

export default Admin;
