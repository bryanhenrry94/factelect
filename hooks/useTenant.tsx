"use client";
import { getSubdomain } from "@/lib/domain";
import { getTenantBySubdomain } from "@/lib/tenant";
import { useEffect, useState } from "react";

// Custom hook para obtener tenant desde el hostname
const useTenant = () => {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const hostname = window.location.hostname;
        const subdomain = getSubdomain(hostname);

        if (!subdomain) {
          setError("No se pudo determinar la empresa desde el subdominio.");
          setLoading(false);
          return;
        }

        const data = await getTenantBySubdomain(subdomain || "");

        setTenant(data);
      } catch (err) {
        console.error("Error fetching tenant:", err);
        setError("No se pudo cargar la información de la empresa.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, []);

  return { tenant, loading, error };
};

export default useTenant;
