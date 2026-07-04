import "../styles/salesRepModal.css";

function SalesRepModal({ isOpen, onClose, message }) {
  if (!isOpen) return null;

  const salesReps = [
    
     {
  initials: "MS",
  name: "Main Sales Desk",
  title: "Senior Wholesale Consultant",
  phone: "233553606554",
  status: "Online",
},
    {
      initials: "AF",
      name: "AFRIYIE",
      title: "Wholesale Sales",
      phone: "233249141659",
      status: "Online",
    },
    {
      initials: "MO",
      name: "MONO",
      title: "Wholesale Sales",
      phone: "233591969427",
      status: "Online",
    },
    {
      initials: "JA",
      name: "JOSHUA",
      title: "Customer Support",
      phone: "233202430406",
      status: "Online",
    },
  ];

  const openWhatsApp = (phone) => {
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );

    onClose();
  };

  return (
    <div className="sales-modal-overlay">
      <div className="sales-modal">

        <button
          className="sales-modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="sales-header">
          <div className="sales-logo">SB</div>

          <h2>StreetBois Fashion</h2>

          <p>
            Choose the sales representative you'd like to
            chat with.
          </p>
        </div>

        <div className="sales-rep-list">
          {salesReps.map((rep) => (
            <div
              className="sales-rep-card"
              key={rep.phone}
            >
              <div className="sales-avatar">
                {rep.initials}
              </div>

              <div className="sales-details">
                <h3>{rep.name}</h3>

                <small>{rep.title}</small>

                <div className="sales-status">
                  🟢 {rep.status}
                </div>


                <span>+{rep.phone}</span>
              </div>

              <button
                className="sales-chat-btn"
                onClick={() => openWhatsApp(rep.phone)}
              >
                Chat
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SalesRepModal;