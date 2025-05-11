import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function PacienteDetalhes({ paciente, show, handleClose }) {
  const [endereco, setEndereco] = useState([]);
  const [telefones, setTelefones] = useState([]);
  const [documentos, setDocumentos] = useState([]);

  useEffect(() => {
    if (paciente) {
      api.get(`/enderecos/${paciente.id}/paciente`).then(res => setEndereco(res.data));
      api.get(`/telefones/${paciente.id}/paciente`).then(res => setTelefones(res.data));
      api.get(`/documentos/${paciente.id}/paciente`).then(res => setDocumentos(res.data));
    }
  }, [paciente]);

  return (
    show && (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 overflow-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4">
          <div className="flex justify-between items-center border-b px-4 py-3">
            <h3 className="text-xl font-semibold">Detalhes do Paciente</h3>
            <button className="text-gray-600 hover:text-gray-900 text-2xl" onClick={handleClose}>
              &times;
            </button>
          </div>

          <div className="px-4 py-3">
            <div className="border-b mb-4">
              <nav className="flex space-x-4">
                {["Dados Pessoais", "Telefones", "Endereços", "Documentos"].map((tabName) => (
                  <button
                    key={tabName}
                    className={`py-2 px-3 ${activeTab === tabName
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                    onClick={() => setActiveTab(tabName)}
                  >
                    {tabName}
                  </button>
                ))}
              </nav>
            </div>

            <div className="overflow-auto max-h-[60vh]">
              {activeTab === "Dados Pessoais" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <p><strong>Código:</strong> {paciente.codigo}</p>
                    <p className="md:col-span-2"><strong>Nome:</strong> {paciente.nome}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <p><strong>Nascimento:</strong> {new Date(paciente.dataNascimento).toLocaleDateString()}</p>
                    <p><strong>Sexo:</strong> {paciente.sexo}</p>
                    <p><strong>Estado Civil:</strong> {paciente.estadoCivil}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <p><strong>Estado:</strong> {paciente.estado}</p>
                    <p><strong>Naturalidade:</strong> {paciente.naturalidade}</p>
                    <p><strong>Nacionalidade:</strong> {paciente.nacionalidade}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <p><strong>Email:</strong> {paciente.email}</p>
                    <p><strong>Data Entrada:</strong> {paciente.dataEntrada}</p>
                  </div>
                  <div>
                    <p><strong>Obs:</strong> {paciente.obs}</p>
                  </div>
                </div>
              )}

              {activeTab === "Telefones" && (
                <div>
                  {telefones.length === 0 ? (
                    <p>Nenhum telefone cadastrado.</p>
                  ) : (
                    telefones.map((t) => (
                      <p key={t.id}>
                        <strong>{t.tipo}:</strong> {t.numero}
                      </p>
                    ))
                  )}
                </div>
              )}

              {activeTab === "Endereços" && (
                <div>
                  {endereco.length === 0 ? (
                    <p>Nenhum endereço cadastrado.</p>
                  ) : (
                    endereco.map((e) => (
                      <div key={e.id} className="mb-2">
                        <p>
                          <strong>Endereço:</strong> {e.logradouro}, {e.numero} - {e.bairro}, {e.cidade}/{e.estado} - {e.cep}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "Documentos" && (
                <div>
                  {documentos.length === 0 ? (
                    <p>Nenhum documento cadastrado.</p>
                  ) : (
                    documentos.map((d) => (
                      <div key={d.id} className="mb-2">
                        <p>
                          <strong>{d.tipo}:</strong> {d.numero} ({d.emissor})
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t px-4 py-3">
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              onClick={handleClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  );
}
