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
    image_file: null,
    image_url: "",
    description: "",
    stock: "",
    featured: false,
  };

  const emptyCollection = {
    name: "",
    image_file: null,
  };

  const [rows, setRows] = useState([{ ...emptyRow }]);
  const [collectionForm, setCollectionForm] = useState({ ...emptyCollection });
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collectionLoading, setCollectionLoading] = useState(false);
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
    fetchCollections();
    fetchProfiles();
  }, []);

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
      console.log(error);
      setMessage(error.message);
    }

    setLoading(false);
  };

  const uploadCollection = async () => {
  setCollectionLoading(true);
  setMessage("");

  try {
    console.log("Starting upload...");

    const imageUrl = await uploadCollectionImage(collectionForm.image_file);

    console.log("Image URL:", imageUrl);

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: collectionForm.name,
        image_url: imageUrl,
      })
      .select();

    console.log("Insert Result:", data);
    console.log("Insert Error:", error);

    if (error) throw error;

    setMessage("Collection uploaded successfully.");
    fetchCollections();
  } catch (error) {
    console.error(error);
    setMessage(error.message);
  }

  setCollectionLoading(false);
};

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  const deleteCollection = async (id) => {
    if (!window.confirm("Delete this collection?")) return;

    await supabase.from("categories").delete().eq("id", id);
    fetchCollections();
  };

  return (
    <section className="admin-page">
      <div className="admin-table-wrapper">
        <div className="admin-header admin-header-flex">
          <div>
            <h1>StreetBois Admin Dashboard</h1>
            <p>Add products and manage homepage collections.</p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {message && <div className="admin-message">{message}</div>}

        <h2>Add Products</h2>

        <div className="admin-table-scroll">
          <table className="admin-product-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Image Upload</th>
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
            {loading ? "Uploading..." : "Upload Products"}
          </button>
        </div>

        <hr style={{ margin: "40px 0" }} />

        <h2>Add Explore Collection</h2>

        <div className="admin-table-scroll">
          <table className="admin-product-table">
            <thead>
              <tr>
                <th>Collection Name</th>
                <th>Collection Image</th>
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
                    placeholder="e.g. Men Clothing"
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
                  <button onClick={uploadCollection} disabled={collectionLoading}>
                    {collectionLoading ? "Uploading..." : "Upload Collection"}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <hr style={{ margin: "40px 0" }} />

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
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "contain",
                      background: "#fff",
                    }}
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

        <hr style={{ margin: "40px 0" }} />

        <h2>Uploaded Products</h2>

        <table className="admin-product-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Featured</th>
              <th>Delete</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <img
                    src={product.image_url}
                    alt={product.name}
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "contain",
                      background: "#fff",
                    }}
                  />
                </td>
                <td>{product.name}</td>
                <td>GH₵ {product.price}</td>
                <td>{product.category}</td>
                <td>{product.featured ? "Yes" : "No"}</td>
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
          </tbody>
        </table>

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