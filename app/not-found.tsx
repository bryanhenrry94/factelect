import React from "react";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc", // fondo claro
        color: "#1e293b", // texto oscuro
        fontFamily: "'Inter', 'Roboto', sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "4rem",
          fontWeight: 700,
          letterSpacing: "-0.05em",
          marginBottom: "1rem",
        }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: "1.25rem",
          fontWeight: 400,
          marginBottom: "2rem",
        }}
      >
        Página no encontrada
      </p>
      <a
        href="/"
        style={{
          padding: "0.75rem 1.5rem",
          background: "#2563eb", // azul del sistema
          color: "#fff",
          borderRadius: "0.5rem",
          textDecoration: "none",
          fontWeight: 500,
          fontSize: "1rem",
          boxShadow: "0 2px 8px rgba(37,99,235,0.08)",
          transition: "background 0.2s",
        }}
      >
        Volver al inicio
      </a>
    </div>
  );
}
