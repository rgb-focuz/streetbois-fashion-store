{activeTab === "collections" && hasPermission("collections") && (
  <>
    <div className="admin-card collection-upload-card">
      <div className="collection-upload-header">
        <div>
          <span>COLLECTION MANAGER</span>
          <h2>Add Explore Collection</h2>
          <p>Create collection categories that appear on the store homepage.</p>
        </div>
      </div>

      <div className="collection-upload-layout">
        <div className="collection-form-area">
          <label>Collection Name</label>
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

          <label>Collection Image</label>
          <div className="collection-file-box">
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

            <p>Upload JPG, PNG or WEBP image</p>
          </div>

          <div className="collection-actions">
            <button
              className="upload-all-btn"
              onClick={uploadCollection}
              disabled={collectionLoading}
            >
              {collectionLoading ? "Uploading..." : "+ Create Collection"}
            </button>

            <button
              type="button"
              className="remove-row-btn"
              onClick={() => setCollectionForm({ ...emptyCollection })}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="collection-preview-area">
          <h3>Preview</h3>

          {collectionForm.image_file ? (
            <img
              src={URL.createObjectURL(collectionForm.image_file)}
              alt="Collection preview"
            />
          ) : (
            <div className="collection-empty-preview">
              No image selected
            </div>
          )}

          <strong>
            {collectionForm.name || "Collection Name"}
          </strong>
        </div>
      </div>
    </div>

    <div className="admin-card collection-list-card">
      <div className="collection-list-header">
        <div>
          <h2>Uploaded Collections</h2>
          <p>{collections.length} collection(s) available</p>
        </div>
      </div>

      <div className="admin-table-scroll">
        <table className="admin-product-table collection-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Collection Name</th>
              <th>Created Date</th>
              <th>Delete</th>
            </tr>
          </thead>

          <tbody>
            {collections.length === 0 ? (
              <tr>
                <td colSpan="4">No collections uploaded yet.</td>
              </tr>
            ) : (
              collections.map((collection) => (
                <tr key={collection.id}>
                  <td>
                    <img
                      src={collection.image_url}
                      alt={collection.name}
                      className="collection-table-img"
                    />
                  </td>

                  <td>
                    <strong>{collection.name}</strong>
                  </td>

                  <td>
                    {collection.created_at
                      ? new Date(collection.created_at).toLocaleString()
                      : "N/A"}
                  </td>

                  <td>
                    <button
                      className="remove-row-btn"
                      onClick={() => deleteCollection(collection.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </>
)}