import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/riderTracking.css";

function RiderTracking() {
  const { orderId, token } = useParams();
  const watchIdRef = useRef(null);
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Loading delivery...");
  const [sharing, setSharing] = useState(false);
  const [lastLocation, setLastLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const customerInitials = useMemo(() => {
    const name = order?.customer_name || "Customer";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [order]);

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      const { data, error } = await supabase.rpc("get_rider_tracking_order", {
        p_order_id: orderId,
        p_tracking_token: token,
      });

      if (!active) return;

      if (error || !data) {
        setMessage(error?.message || "This tracking link is not valid.");
        setStatus("Tracking unavailable");
        setLoading(false);
        return;
      }

      setOrder(data);
      setSharing(Boolean(data.live_tracking_active));
      setStatus(data.live_tracking_active ? "Live GPS is active" : "Ready to start delivery");
      setLoading(false);
    };

    loadOrder();

    return () => {
      active = false;
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [orderId, token]);

  const sendLocation = async (position) => {
    const coords = position.coords;
    const lat = Number(coords.latitude);
    const lng = Number(coords.longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180 ||
      (lat === 0 && lng === 0)
    ) {
      setMessage("The phone returned an invalid GPS point. Please turn on location services and try again.");
      setStatus("Waiting for valid GPS");
      setSharing(false);
      return;
    }

    setSaving(true);

    const { error } = await supabase.rpc("update_delivery_live_location", {
      p_order_id: orderId,
      p_tracking_token: token,
      p_lat: lat,
      p_lng: lng,
      p_accuracy: coords.accuracy,
    });

    setSaving(false);

    if (error) {
      setMessage(error.message || "Could not update live location.");
      setStatus("Location update failed");
      return;
    }

    setLastLocation({
      lat,
      lng,
      accuracy: coords.accuracy,
      time: new Date().toLocaleTimeString(),
    });
    setMessage("");
    setStatus("Live GPS is active");
    setSharing(true);
  };

  const startSharing = () => {
    setMessage("");

    if (!navigator.geolocation) {
      setMessage("This phone/browser does not support GPS tracking.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      sendLocation,
      (error) => {
        setMessage(
          error.message ||
            "Location permission was denied. Please allow location access."
        );
        setStatus("Location permission needed");
        setSharing(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 20000,
      }
    );
  };

  const stopSharing = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setSharing(false);
    setStatus("Live GPS paused");
  };

  const completeDelivery = async () => {
    if (!window.confirm("Mark this order as delivered?")) return;

    setSaving(true);

    const { data, error } = await supabase.rpc("complete_delivery_by_rider", {
      p_order_id: orderId,
      p_tracking_token: token,
    });

    setSaving(false);

    if (error || !data?.success) {
      setMessage(error?.message || "Could not mark delivery as complete.");
      return;
    }

    stopSharing();
    setOrder((current) => ({ ...(current || {}), status: "Delivered" }));
    setStatus("Delivery completed");
    setMessage("Order marked as delivered. Customer can confirm receipt.");
  };

  if (loading) {
    return <main className="rider-tracking-page">Loading delivery...</main>;
  }

  return (
    <main className="rider-tracking-page">
      <section className="rider-card">
        <div className="rider-brand">
          <span>SB</span>
          <div>
            <strong>StreetBois Delivery</strong>
            <p>{status}</p>
          </div>
        </div>

        {message && <div className="rider-alert">{message}</div>}

        {order ? (
          <>
            <div className="rider-customer">
              <span>{customerInitials}</span>
              <div>
                <h1>{order.customer_name}</h1>
                <p>{order.customer_phone}</p>
              </div>
            </div>

            <div className="rider-detail">
              <strong>Delivery Address</strong>
              <p>{order.delivery_address}</p>
            </div>

            <div className="rider-detail">
              <strong>Order Status</strong>
              <p>{order.status}</p>
            </div>

            {lastLocation && (
              <div className="rider-live-box">
                <strong>Last GPS Update</strong>
                <p>
                  {lastLocation.lat.toFixed(6)}, {lastLocation.lng.toFixed(6)}
                </p>
                <small>
                  Accuracy: {Math.round(lastLocation.accuracy || 0)}m ·{" "}
                  {lastLocation.time}
                </small>
              </div>
            )}

            <div className="rider-actions">
              {!sharing ? (
                <button type="button" onClick={startSharing} disabled={saving}>
                  Start Live GPS
                </button>
              ) : (
                <button type="button" onClick={stopSharing} disabled={saving}>
                  Pause GPS
                </button>
              )}

              <button type="button" onClick={completeDelivery} disabled={saving}>
                {saving ? "Saving..." : "Mark Delivered"}
              </button>
            </div>

            <a className="rider-call" href={`tel:${order.customer_phone}`}>
              Call Customer
            </a>
          </>
        ) : (
          <Link to="/">Return Home</Link>
        )}
      </section>
    </main>
  );
}

export default RiderTracking;
