import React, { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import PacienteDetalhesModal from "./PacienteDetalhes";
import "./cadastroPaciente.css";

export default function PacientesLista() {
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [showModalDetalhes, setShowModalDetalhes] = useState(false);
  const [toastDelete, setToastDelete] = useState({ show: false, id: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fetchPacientes = async () => {
    try {
      const res = await api.get('/pacientes');
      setPacientes(res.data);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/pacientes/${toastDelete.id}`);
      setToastDelete({ show: false, id: null });
      fetchPacientes();
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
    }
  };

  const filteredPacientes = pacientes.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPacientes.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>

      <PageMeta
        title="OdontoSys | Dashboard de Clínica Odontológica em React.js"
        description="Esta é a página do Dashboard da Clínica Odontológica OdontoSys, desenvolvido com React.js e Tailwind CSS"
      />
      <PageBreadcrumb pageTitle="Pacientes" />

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-1">
        <div className="flex justify-between items-center mb-4">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md"
            onClick={() => navigate('/pacientes/cadastrar')}
          >
            + Novo Paciente
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div className="overflow-auto mb-4">
          <table className="min-w-full border-collapse table-auto text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-3 py-2">Nome</th>
                <th className="border px-3 py-2">Email</th>
                <th className="border px-3 py-2">Nascimento</th>
                <th className="border px-3 py-2">Sexo</th>
                <th className="border px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((p) => (
                <tr key={p.id} className="text-center">
                  <td className="border px-2 py-1">{p.nome}</td>
                  <td className="border px-2 py-1">{p.email}</td>
                  <td className="border px-2 py-1">{new Date(p.dataNascimento).toLocaleDateString()}</td>
                  <td className="border px-2 py-1">{p.sexo}</td>
                  <td className="border px-2 py-1 flex gap-1 justify-center">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-xs"
                      onClick={() => { setPacienteSelecionado(p); setShowModalDetalhes(true); }}
                    >
                      Visualizar
                    </button>
                    <button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-md text-xs"
                      onClick={() => navigate(`/pacientes/cadastrar/${p.id}`)}
                    >
                      Editar
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-xs"
                      onClick={() => setToastDelete({ show: true, id: p.id })}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center mt-4">
          <nav className="inline-flex rounded-md shadow-sm">
            {[...Array(Math.ceil(filteredPacientes.length / itemsPerPage)).keys()].map(number => (
              <button
                key={number + 1}
                className={`px-3 py-1 border border-gray-300 ${currentPage === number + 1 ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'} hover:bg-blue-500 hover:text-white`}
                onClick={() => paginate(number + 1)}
              >
                {number + 1}
              </button>
            ))}
          </nav>
        </div>

        {showModalDetalhes && (
          <PacienteDetalhesModal
            paciente={pacienteSelecionado}
            show={showModalDetalhes}
            handleClose={() => setShowModalDetalhes(false)}
          />
        )}

        {/* <ToastConfirmacao
                  show={toastDelete.show}
                  onHide={() => setToastDelete({ show: false, id: null })}
                  onConfirm={handleDeleteConfirm}
                  mensagem="Tem certeza que deseja excluir este paciente?"
                /> */}

      </div>

    </>
  );
}
