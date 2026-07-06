import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select("role,is_active")
        .eq("email", session.user.email)
        .single();

      if (
        error ||
        !data ||
        data.is_active === false
      ) {
        await supabase.auth.signOut();
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }

      setLoading(false);
    };

    checkAccess();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return authorized ? children : <Navigate to="/admin-login" replace />;
}

export default ProtectedRoute;