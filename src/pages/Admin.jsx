import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/admin.css";

function Admin() {
  const navigate = useNavigate();

  const emptyRow = {
    name: "",
    price: "",
    category: "",
    product_type: "",
    brand: "",
    sku: "",
    sizes: "",
    stock: "",
    image_url: "",
    description: "",
    in_stock: true,
    featured: false,
    status: "Active",
  };

  const [rows, setRows] = useState([{ ...emptyRow }]);
  const [products, setProducts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  useEffect(() => {
    fetchProducts();
    fetchProfiles();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setProducts(data);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setProfiles(data);
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

  const addRow = () => setRows([...rows, { ...emptyRow }]);

  const removeRow = (index) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const uploadAllProducts = async () => {
    setLoading(true);
    setMessage("");

    const validRows = rows.filter(
      (item) => item.name && item.price && item.category && item.image_url
    );

    const productsToUpload = validRows.map((item) => ({
      name: item.name,
      price: Number(item.price),
      category: item.category,
      product_type: item.product_type,
      brand: item.brand,
      sku: item.sku,
      sizes: item.sizes,
      stock: Number(item.stock || 0),
      image_url: item.image_url,
      description: item.description,
      in_stock: item.in_stock,
      featured: item.featured,
      status: item.status,
    }));

    const { error } = await supabase.from("products").insert(productsToUpload);

    if (error) {
      setMessage("Upload failed.");
    } else {
      setMessage(`${validRows.length} products uploaded successfully.`);
      setRows([{ ...emptyRow }]);
      fetchProducts();
    }

    setLoading(false);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (!error) fetchProducts();
  };

  const startEdit = (product) => {
    setEditingProduct({ ...product });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
  };

  const handleEditChange = (field, value) => {
    setEditingProduct({
      ...editingProduct,
      [field]: value,
    });
  };

  const saveEdit = async () => {
    const { id, created_at, ...updateData } = editingProduct;

    const { error } = await supabase
      .from("products")
      .update({
        ...updateData,
        price: Number(updateData.price),
        stock: Number(updateData.stock || 0),
      })
      .eq("id", id);

    if (error) {
      setMessage("Update failed.");
    } else {
      setMessage("Product updated successfully.");
      setEditingProduct(null);
      fetchProducts();
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-table-wrapper">
        <div className="admin-header admin-header-flex">
          <div>
            <h1>StreetBois Admin Dashboard</h1>
            <p>Add, edit and manage products.</p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {message && <div className="admin-message">{message}</div>}

        <div className="admin-table-scroll">
          <table className="admin-product-table">
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input value={row.name} onChange={(e) => handleChange(index, "name", e.target.value)} placeholder="Name" />
                  </td>
                  <td>
                    <input value={row.price} onChange={(e) => handleChange(index, "price", e.target.value)} placeholder="Price" />
                  </td>
                  <td>
                    <select value={row.category} onChange={(e) => handleChange(index, "category", e.target.value)}>
                      <option value="">Select</option>
                      {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </td>
                  <td>
                    <input value={row.image_url} onChange={(e) => handleChange(index, "image_url", e.target.value)} placeholder="Image URL" />
                  </td>
                  <td>
                    <button onClick={() => removeRow(index)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-table-actions">
          <button onClick={addRow}>+ Add Row</button>
          <button onClick={uploadAllProducts} disabled={loading}>
            {loading ? "Uploading..." : "Upload All Products"}
          </button>
        </div>

        <hr style={{ margin: "40px 0" }} />

        <h2>Uploaded Products</h2>

        <table className="admin-product-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>GH₵ {product.price}</td>
                <td>{product.category}</td>
                <td><button onClick={() => startEdit(product)}>Edit</button></td>
                <td>
                  <button className="remove-row-btn" onClick={() => deleteProduct(product.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editingProduct && (
          <div className="edit-product-box">
            <h2>Edit Product</h2>

            <input value={editingProduct.name || ""} onChange={(e) => handleEditChange("name", e.target.value)} placeholder="Product name" />
            <input type="number" value={editingProduct.price || ""} onChange={(e) => handleEditChange("price", e.target.value)} placeholder="Price" />

            <select value={editingProduct.category || ""} onChange={(e) => handleEditChange("category", e.target.value)}>
              <option value="">Select</option>
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <input value={editingProduct.image_url || ""} onChange={(e) => handleEditChange("image_url", e.target.value)} placeholder="Image URL" />
            <input value={editingProduct.description || ""} onChange={(e) => handleEditChange("description", e.target.value)} placeholder="Description" />
            <input type="number" value={editingProduct.stock || ""} onChange={(e) => handleEditChange("stock", e.target.value)} placeholder="Stock" />

            <div className="admin-table-actions">
              <button onClick={saveEdit}>Save Changes</button>
              <button onClick={cancelEdit}>Cancel</button>
            </div>
          </div>
        )}

        <hr style={{ margin: "40px 0" }} />

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
    </section>
  );
}

export default Admin;