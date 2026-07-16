import { createPortal } from "react-dom";
import "../styles/salesRepModal.css";

function SalesRepModal({ isOpen, onClose, message, salesReps }) {
  if (!isOpen) return null;

  const defaultSalesReps = [
    {
      initials: "SB",
      name: "StreetBois Sales",
      title: "Sales WhatsApp",
      phone: "233202430406",
      status: "Online",
    },
  ];

  const activeSalesReps =
    Array.isArray(salesReps) && salesReps.length > 0 ? salesReps : defaultSalesReps;

  const openWhatsApp = (phone) => {
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );

    onClose();
  };

  return createPortal(
    <div className="sales-modal-overlay">
      <div className="sales-modal">
        <button
          type="button"
          className="sales-modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="sales-header">
          <div className="sales-logo">SB</div>
          <span>WhatsApp order support</span>
          <h2>Complete your order</h2>
          <p>
            Send your selected product details to our sales desk on WhatsApp.
          </p>
        </div>

        <div className="sales-rep-list">
          {activeSalesReps.map((rep) => (
            <div className="sales-rep-card" key={rep.phone}>
              <div className="sales-avatar">{rep.initials}</div>

              <div className="sales-details">
                <h3>{rep.name}</h3>
                <small>{rep.title}</small>
                <div className="sales-meta-row">
                  <span className="sales-status">{rep.status}</span>
                  <span>+{rep.phone}</span>
                </div>
              </div>

              <button
                type="button"
                className="sales-chat-btn"
                onClick={() => openWhatsApp(rep.phone)}
              >
                Continue
              </button>
            </div>
          ))}
        </div>

        <p className="sales-modal-note">
          WhatsApp will open with the order message already filled in.
        </p>
      </div>
    </div>,
    document.body
  );
}

export default SalesRepModal;
