// Arquivo adaptado para uso com TailwindCSS e sem react-bootstrap

import React, { useEffect, useState } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import api from '../../services/api';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import debounce from 'lodash/debounce';

export default function ConsultasLista() {
  const [consultas, setConsultas] = useState([]);
  const [filtros, setFiltros] = useState({ nomePaciente: '', nomeProfissional: '', status: '' });
  const [showModal, setShowModal] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState(null);
  const [formData, setFormData] = useState({ pacienteId: '', profissionalId: '', data: '', hora: '', status: 'Agendado', obs: '' });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [sugestoesPacientes, setSugestoesPacientes] = useState([]);
  const [sugestoesProfissionais, setSugestoesProfissionais] = useState([]);

  const registrosPorPagina = 10;

  useEffect(() => {
    carregarConsultas();
  }, []);

  const carregarConsultas = async () => {
    try {
      const response = await api.get('/consultas/vwcompleta');
      setConsultas(response.data);
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
    }
  };

  const calcularIdade = (dataNascimento) => {
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const handleOpenModal = (consulta = null) => {
    if (consulta) {
      const hora = new Date(consulta.data_agendamento).toISOString().slice(11, 16);
      setFormData({
        pacienteId: consulta.pacienteId,
        profissionalId: consulta.profissionalId,
        data: consulta.data_agendamento.slice(0, 10),
        hora,
        status: consulta.situacao,
        obs: consulta.obs,
      });
    } else {
      setFormData({ pacienteId: '', profissionalId: '', data: '', hora: '', status: 'Agendado', obs: '' });
    }
    setConsultaSelecionada(consulta);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setConsultaSelecionada(null);
  };

  const handleSave = async () => {
    //const dataCompleta = ${formData.data}T${formData.hora}:00.000Z;
    const payload = { ...formData, data: dataCompleta };
    try {
      if (consultaSelecionada) {
        await api.put("/consultas/${consultaSelecionada.id}", payload);
      } else {
        await api.post('/consultas', payload);
      }
      carregarConsultas();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar consulta:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir esta consulta?')) {
      try {
        await api.delete("/consultas/${id}");
        carregarConsultas();
      } catch (error) {
        console.error('Erro ao excluir consulta:', error);
      }
    }
  };

  const consultasFiltradas = consultas.filter((c) => {
    return (
      (!filtros.nomePaciente || c.nome_paciente?.toLowerCase().includes(filtros.nomePaciente.toLowerCase())) &&
      (!filtros.nome_profissional || c.nome_profissional?.toLowerCase().includes(filtros.nomeProfissional.toLowerCase())) &&
      (!filtros.status || c.situacao === filtros.status)
    );
  });

  const consultasPaginadas = consultasFiltradas.slice(
    (paginaAtual - 1) * registrosPorPagina,
    paginaAtual * registrosPorPagina
  );

  const exportarExcel = () => {
    const dados = consultasFiltradas.map(c => ({
      ID: c.id,
      Paciente: c.nome_paciente,
      Idade: calcularIdade(c.dataNascimento),
      Convenio: c.convenio,
      Profissional: c.nome_profissional,
      Especialidades: c.especialidades,
      Departamentos: c.departamentos,
      Data: new Date(c.data_agendamento).toLocaleDateString(),
      Hora: new Date(c.data_agendamento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      Status: c.situacao,
      Observações: c.obs
    }));
    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consultas');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'consultas.xlsx');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const colunas = ["Paciente", "Profissional", "Data", "Hora", "Status"];
    const linhas = consultasFiltradas.map(c => [
      c.nome_paciente,
      c.nome_profissional,
      new Date(c.data_agendamento).toLocaleDateString(),
      new Date(c.data_agendamento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      c.situacao
    ]);
    doc.text('Relatório de Consultas', 14, 10);
    autoTable(doc, { head: [colunas], body: linhas, startY: 20 });
    doc.save('consultas.pdf');
  };

  const buscarPacientes = debounce(async (termo) => {
    try {
      const res = await api.get("/pacientes?search=${termo}");
      setSugestoesPacientes(res.data);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  }, 500);

  const buscarProfissionais = debounce(async (termo) => {
    try {
      const res = await api.get("/profissionais?search=${termo}");
      setSugestoesProfissionais(res.data);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
    }
  }, 500);



  useEffect(() => {
    carregarConsultas();
  }, []);

  const totalPaginas = Math.ceil(consultasFiltradas.length / registrosPorPagina);

  return (
    <>

      <PageMeta
        title="OdontoSys | Dashboard de Clínica Odontológica em React.js"
        description="Esta é a página do Dashboard da Clínica Odontológica OdontoSys, desenvolvido com React.js e Tailwind CSS"
      />
      <PageBreadcrumb pageTitle="Consultas" />


          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input className="border rounded px-3 py-2" placeholder="Paciente" value={filtros.nomePaciente} onChange={e => setFiltros({ ...filtros, nomePaciente: e.target.value })} />
              <input className="border rounded px-3 py-2" placeholder="Profissional" value={filtros.nomeProfissional} onChange={e => setFiltros({ ...filtros, nomeProfissional: e.target.value })} />
              <select className="border rounded px-3 py-2" value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })}>
                <option value="">Todos os status</option>
                <option value="Agendado">Agendado</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 mb-4">
              <button onClick={() => { }} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Exportar Excel</button>
              <button onClick={() => { }} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">Exportar PDF</button>
              <button onClick={() => setShowModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><FaPlus /> Nova Consulta</button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="px-2 py-1 border">#</th>
                    <th className="px-2 py-1 border">Paciente</th>
                    <th className="px-2 py-1 border">Idade</th>
                    <th className="px-2 py-1 border">Convênio</th>
                    <th className="px-2 py-1 border">Profissional</th>
                    <th className="px-2 py-1 border">Especialidades</th>
                    <th className="px-2 py-1 border">Departamento</th>
                    <th className="px-2 py-1 border">Data</th>
                    <th className="px-2 py-1 border">Hora</th>
                    <th className="px-2 py-1 border">Status</th>
                    <th className="px-2 py-1 border">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {consultasPaginadas.map((c, index) => (
                    <tr key={c.id} className="hover:bg-gray-100">
                      <td className="px-2 py-1 border">{index + 1}</td>
                      <td className="px-2 py-1 border">{c.nome_paciente}</td>
                      <td className="px-2 py-1 border">{c.dataNascimento ? calcularIdade(c.dataNascimento) : '-'}</td>
                      <td className="px-2 py-1 border">{c.convenio || '-'}</td>
                      <td className="px-2 py-1 border">{c.nome_profissional}</td>
                      <td className="px-2 py-1 border">{c.especialidades || '-'}</td>
                      <td className="px-2 py-1 border">{c.departamentos || '-'}</td>
                      <td className="px-2 py-1 border">{new Date(c.data_agendamento).toLocaleDateString()}</td>
                      <td className="px-2 py-1 border">{new Date(c.data_agendamento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-2 py-1 border">{c.situacao}</td>
                      <td className="px-2 py-1 border text-center space-x-2">
                        <button className="text-blue-600 hover:underline" onClick={() => setShowModal(true)}><FaEdit /></button>
                        <button className="text-red-600 hover:underline" onClick={() => { }}><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span>Página {paginaAtual} de {totalPaginas}</span>
              <div className="space-x-2">
                <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={paginaAtual === 1} onClick={() => setPaginaAtual(p => p - 1)}>Anterior</button>
                <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual(p => p + 1)}>Próxima</button>
              </div>
            </div>

            {/* Modal será substituído posteriormente por componente Tailwind */}
          </div>


    </>

  );
}
