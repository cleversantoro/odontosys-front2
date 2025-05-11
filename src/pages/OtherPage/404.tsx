// src/pages/NotFound.tsx
import React from "react";
import { Link } from "react-router-dom";

const NotFound404 = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-6">
      {/* Dentinho cartoon */}
      <div className="w-40 h-40 mb-6">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <path
            d="M32 2C22 2 14 10 14 20c0 10-4 14-4 22 0 6 3 10 6 10 3 0 5-3 7-10 2-7 4-7 5-7s3 0 5 7c2 7 4 10 7 10 3 0 6-4 6-10 0-8-4-12-4-22 0-10-8-18-18-18z"
            fill="#fff"
            stroke="#000"
            strokeWidth="2"
          />
          <circle cx="24" cy="24" r="2" fill="#000" />
          <circle cx="40" cy="24" r="2" fill="#000" />
          <path d="M26 36c2 2 8 2 10 0" stroke="#000" strokeWidth="2" />
        </svg>
      </div>

      {/* Texto principal */}
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Página não encontrada</h1>
      <p className="text-gray-600 mb-6">
        Ué... essa página escapou do consultório!<br />
        Verifique o endereço ou volte para o início.
      </p>

      {/* Botão voltar */}
      <Link
        to="/"
        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg shadow-md transition"
      >
        Voltar para a Home
      </Link>
    </div>
  );
};

export default NotFound404;
