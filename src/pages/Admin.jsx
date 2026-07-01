import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../styles/admin.css";

function Admin() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const emptyRow = {
    name: "",
    price: "",
    category: "",
    image_file: null,
    description: "",
    stock: "",
    featured: false,
  };

  const emptyCollection = {
    name: "",
    image_file: null,
  };

  const [rows, setRows] = useState([{ ...emptyRow }]);
  const [bulkSettings, setBulkSettings] = useState({
  price: "",
  category: "",
  stock: "",
  featured: false,
  description: "",
});
  const [collectionForm, setCollectionForm] = useState({ ...emptyCollection });

  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [orders, setOrders] = useState([]);
const [selectedOrder, setSelectedOrder] = useState(null);
const [orderFilter, setOrderFilter] = useState("All");

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
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("streetbois-admin-settings");

    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          businessName: "StreetBois Fashion",
          phone: "0202430406",
          whatsapp: "233202430406",
          email: "apodeijoshuaagudey1@gmail.com",
          address: "Accra (TUDU), Ghana",
          deliveryNote: "Delivery available within Ghana.",
        };
  });


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

  const changeTab = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveSettings = () => {
    localStorage.setItem("streetbois-admin-settings", JSON.stringify(settings));
    setMessage("Settings saved successfully.");
  };

  useEffect(() => {
    fetchProducts();
    fetchCollections();
    fetchProfiles();
    fetchOrders();
  }, []);

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
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    setProfiles(data || []);
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

  const updateOrderStatus = async (id, status) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Order status updated.");
    fetchOrders();
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

  const addRow = () => {
    setRows([...rows, { ...emptyRow }]);
  };

  const removeRow = (index) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const uploadImage = async (file, category) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

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
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

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

        productsToUpload.push({
          name: item.name,
          price: Number(item.price),
          category: item.category,
          image_url: imageUrl,
          description: item.description,
          stock: Number(item.stock || 0),
          in_stock: true,
          featured: item.featured,
          status: "Active",
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
      stock: product.stock || 0,
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

      const { error } = await supabase
        .from("products")
        .update({
          name: editingProduct.name,
          price: Number(editingProduct.price),
          category: editingProduct.category,
          description: editingProduct.description,
          stock: Number(editingProduct.stock),
          featured: editingProduct.featured,
          status: editingProduct.status,
          image_url: imageUrl,
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      setMessage("Product updated successfully.");
      setEditingProduct(null);
      fetchProducts();
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

  const filteredProducts = products.filter((product) => {
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
      return Number(a.stock || 0) - Number(b.stock || 0);
    }

    if (sortBy === "stock-high") {
      return Number(b.stock || 0) - Number(a.stock || 0);
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

  const activeOrders = orders.filter((order) => order.status !== "Cancelled");

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

  const exportProductsPDF = () => {
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

  const exportOrdersPDF = () => {
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

  return (
    <section className={`admin-page ${isMobileMenuOpen ? "mobile-menu-open" : ""}`}>
      <div className="admin-mobile-topbar">
        <button
          className="admin-menu-toggle"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open admin menu"
        >
          ☰
        </button>

        <div>
          <h2>STREETBOIS ADMIN</h2>
          <p>{formattedDate}</p>
        </div>
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

        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => changeTab("dashboard")}
        >
          📊 Dashboard
        </button>

        <button
          className={activeTab === "products" ? "active" : ""}
          onClick={() => changeTab("products")}
        >
          📦 Add Products
        </button>

        <button
          className={activeTab === "collections" ? "active" : ""}
          onClick={() => changeTab("collections")}
        >
          🖼 Collections
        </button>

        <button
          className={activeTab === "manage" ? "active" : ""}
          onClick={() => changeTab("manage")}
        >
          🛒 Manage Products
        </button>

        <button
          className={activeTab === "analytics" ? "active" : ""}
          onClick={() => changeTab("analytics")}
        >
          📈 Analytics
        </button>

       <button
  className={activeTab === "orders" ? "active" : ""}
  onClick={() => changeTab("orders")}
>
  📋 Orders
</button>

        <button
          className={activeTab === "reports" ? "active" : ""}
          onClick={() => changeTab("reports")}
        >
          📄 Reports
        </button>

        <button
          className={activeTab === "messages" ? "active" : ""}
          onClick={() => changeTab("messages")}
        >
          💬 Messages
        </button>

        <button
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => changeTab("settings")}
        >
          ⚙️ Settings
        </button>

        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => changeTab("users")}
        >
          👥 Users
        </button>

        <div style={{ marginTop: "auto", paddingTop: "40px" }}>
          <button className="logout-btn sidebar-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage products, collections, users and inventory.</p>
          </div>

          <div className="admin-date-card">
            <span>Today</span>
            <strong>{formattedDate}</strong>
            <small>{formattedTime}</small>
          </div>
        </div>

        {message && <div className="admin-message">{message}</div>}

        {activeTab === "dashboard" && (
          <div className="admin-dashboard">
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3>Total Products</h3>
                <h1>{products.length}</h1>
              </div>

              <div className="dashboard-card">
                <h3>Collections</h3>
                <h1>{collections.length}</h1>
              </div>

              <div className="dashboard-card">
                <h3>Registered Users</h3>
                <h1>{profiles.length}</h1>
              </div>

              <div className="dashboard-card">
                <h3>Orders</h3>
                <h1>{orders.length}</h1>
              </div>
            </div>

            <div className="dashboard-lists">
              <div className="admin-card">
                <h2>Recent Products</h2>

                {products.slice(0, 5).map((product) => (
                  <div className="dashboard-list-item" key={product.id}>
                    <img src={product.image_url} alt={product.name} />
                    <div>
                      <h4>{product.name}</h4>
                      <p>GH₵ {product.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-card">
                <h2>Low Stock Alerts</h2>

                {products.filter((product) => product.stock <= 5).length ===
                0 ? (
                  <p>No low stock products.</p>
                ) : (
                  products
                    .filter((product) => product.stock <= 5)
                    .slice(0, 5)
                    .map((product) => (
                      <div className="dashboard-list-item" key={product.id}>
                        <img src={product.image_url} alt={product.name} />
                        <div>
                          <h4>{product.name}</h4>
                          <p>{product.stock} left</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="admin-card">

<div className="bulk-settings-box">
  <h3>Bulk Settings</h3>
  <p>Apply the same price, category, stock and description to all upload rows.</p>

  <div className="bulk-settings-grid">
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
          price: bulkSettings.price || row.price,
          category: bulkSettings.category || row.category,
          stock: bulkSettings.stock || row.stock,
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

        {activeTab === "collections" && (
          <>
            <div className="admin-card">
              <h2>Add Explore Collection</h2>

              <div className="admin-table-scroll">
                <table className="admin-product-table">
                  <thead>
                    <tr>
                      <th>Collection Name</th>
                      <th>Image</th>
                      <th>Upload</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>
                        <input
                          value={collectionForm.name}
                          onChange={(e) =>
                            setCollectionForm({
                              ...collectionForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g. Sneakers"
                        />
                      </td>

                      <td>
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
                      </td>

                      <td>
                        <button
                          onClick={uploadCollection}
                          disabled={collectionLoading}
                        >
                          {collectionLoading ? "Uploading..." : "Upload"}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-card">
              <h2>Uploaded Collections</h2>

              <table className="admin-product-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Delete</th>
                  </tr>
                </thead>

                <tbody>
                  {collections.map((collection) => (
                    <tr key={collection.id}>
                      <td>
                        <img
                          src={collection.image_url}
                          alt={collection.name}
                          className="admin-preview-img"
                        />
                      </td>
                      <td>{collection.name}</td>
                      <td>
                        <button
                          className="remove-row-btn"
                          onClick={() => deleteCollection(collection.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "manage" && (
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
                      <td>{product.stock || 0}</td>
                      <td>{getStockBadge(product.stock)}</td>

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
                      <td colSpan="11">No products found.</td>
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

        {activeTab === "analytics" && (
          <div className="admin-dashboard analytics-page">
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3>Total Revenue</h3>
                <h1>GH₵ {totalRevenue.toFixed(2)}</h1>
              </div>

              <div className="dashboard-card">
                <h3>Today's Sales</h3>
                <h1>GH₵ {todayRevenue.toFixed(2)}</h1>
              </div>

              <div className="dashboard-card">
                <h3>Monthly Sales</h3>
                <h1>GH₵ {monthlyRevenue.toFixed(2)}</h1>
              </div>

              <div className="dashboard-card">
                <h3>Returning Customers</h3>
                <h1>{returningCustomers}</h1>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="admin-card revenue-chart-card">
                <div className="analytics-card-header">
                  <div>
                    <span>Monthly Performance</span>
                    <h2>Revenue Chart</h2>
                  </div>
                  <strong>GH₵ {monthlyRevenue.toFixed(2)}</strong>
                </div>

                <div className="revenue-chart">
                  {monthlyRevenueChart.map((item) => (
                    <div className="revenue-bar-wrap" key={item.label}>
                      <div
                        className="revenue-bar"
                        style={{
                          height: `${Math.max(
                            (item.revenue / maxMonthlyChartRevenue) * 100,
                            item.revenue > 0 ? 8 : 2
                          )}%`,
                        }}
                      ></div>
                      <span>{item.label}</span>
                      <small>GH₵ {item.revenue.toFixed(0)}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card revenue-growth-card">
                <div className="analytics-card-header">
                  <div>
                    <span>Growth</span>
                    <h2>Revenue Growth</h2>
                  </div>
                </div>

                <div className="growth-list">
                  {growthCards.map((card) => (
                    <div className="growth-item" key={card.label}>
                      <div>
                        <h4>{card.label}</h4>
                        <p>
                          GH₵ {card.current.toFixed(2)} vs GH₵ {card.previous.toFixed(2)}
                        </p>
                      </div>

                      <strong
                        className={
                          card.value >= 0 ? "growth-positive" : "growth-negative"
                        }
                      >
                        {card.value >= 0 ? "↑" : "↓"} {Math.abs(card.value).toFixed(0)}%
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="analytics-grid three-column">
              <div className="admin-card">
                <h2>Recent Orders</h2>

                {recentOrders.length === 0 ? (
                  <p>No orders yet.</p>
                ) : (
                  recentOrders.map((order) => (
                    <div className="analytics-order-item" key={order.id}>
                      <div>
                        <h4>{order.customer_name}</h4>
                        <p>GH₵ {Number(order.total || 0).toFixed(2)}</p>
                      </div>

                      <span className={`order-status ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-card">
                <h2>⚠ Products Needing Restock</h2>

                {restockProducts.length === 0 ? (
                  <p>No low stock products.</p>
                ) : (
                  restockProducts.map((product) => (
                    <div className="dashboard-list-item" key={product.id}>
                      <img src={product.image_url} alt={product.name} />
                      <div>
                        <h4>{product.name}</h4>
                        <p>{Number(product.stock || 0)} left</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-card">
                <h2>Top Selling Categories</h2>

                {topSellingCategories.length === 0 ? (
                  <p>No category sales yet.</p>
                ) : (
                  topSellingCategories.map((item) => (
                    <div className="category-progress-item" key={item.category}>
                      <div className="category-progress-top">
                        <span>{item.category}</span>
                        <strong>{item.percentage.toFixed(0)}%</strong>
                      </div>

                      <div className="category-progress-track">
                        <div
                          className="category-progress-fill"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>

                      <small>
                        Sold {item.quantity} · GH₵ {item.revenue.toFixed(2)}
                      </small>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="dashboard-lists">
              <div className="admin-card">
                <h2>Best Sellers</h2>

                {bestSellers.length === 0 ? (
                  <p>No sales data yet.</p>
                ) : (
                  bestSellers.map((item) => (
                    <div className="dashboard-list-item" key={item.name}>
                      {item.image_url && <img src={item.image_url} alt={item.name} />}
                      <div>
                        <h4>{item.name}</h4>
                        <p>
                          Sold: {item.quantity} · Revenue: GH₵ {item.revenue}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-card">
                <h2>Worst Sellers</h2>

                {worstSellers.length === 0 ? (
                  <p>No product data yet.</p>
                ) : (
                  worstSellers.map((item) => (
                    <div className="dashboard-list-item" key={item.name}>
                      {item.image_url && <img src={item.image_url} alt={item.name} />}
                      <div>
                        <h4>{item.name}</h4>
                        <p>
                          Sold: {item.quantity} · Revenue: GH₵ {item.revenue}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
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

         {activeTab === "orders" && (
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

        {activeTab === "messages" && (
          <div className="admin-card messages-page">
            <h2>Messages</h2>
            <p className="admin-muted-text">
              Customer contact messages will appear here once the contact form is connected to Supabase.
            </p>

            <div className="empty-state-card">
              <h3>💬 No messages yet</h3>
              <p>
                After we connect your Contact page form to the database, every customer message will show here with name, email, phone and message.
              </p>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="settings-page">
            <div className="admin-card settings-card">
              <h2>Business Settings</h2>
              <p className="admin-muted-text">
                Manage the business details used across your admin workflow.
              </p>

              <div className="settings-grid">
                <label>
                  Business Name
                  <input
                    value={settings.businessName}
                    onChange={(e) =>
                      setSettings({ ...settings, businessName: e.target.value })
                    }
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    value={settings.phone}
                    onChange={(e) =>
                      setSettings({ ...settings, phone: e.target.value })
                    }
                  />
                </label>

                <label>
                  WhatsApp Number
                  <input
                    value={settings.whatsapp}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsapp: e.target.value })
                    }
                  />
                </label>

                <label>
                  Email Address
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) =>
                      setSettings({ ...settings, email: e.target.value })
                    }
                  />
                </label>
              </div>

              <label className="settings-full-label">
                Store Address
                <textarea
                  value={settings.address}
                  onChange={(e) =>
                    setSettings({ ...settings, address: e.target.value })
                  }
                ></textarea>
              </label>

              <label className="settings-full-label">
                Delivery Note
                <textarea
                  value={settings.deliveryNote}
                  onChange={(e) =>
                    setSettings({ ...settings, deliveryNote: e.target.value })
                  }
                ></textarea>
              </label>

              <button className="save-settings-btn" onClick={saveSettings}>
                Save Settings
              </button>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="admin-card">
            <h2>Registered Users</h2>
            <p>Total Users: {profiles.length}</p>

            <table className="admin-product-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Registered Date</th>
                </tr>
              </thead>

              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td>{profile.full_name}</td>
                    <td>{profile.email}</td>
                    <td>{new Date(profile.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  placeholder="Stock"
                  value={editingProduct.stock}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      stock: e.target.value,
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
                <p>{previewProduct.featured ? "Featured" : "Normal Product"}</p>
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

      </main>
    </section>
  );
}

export default Admin;