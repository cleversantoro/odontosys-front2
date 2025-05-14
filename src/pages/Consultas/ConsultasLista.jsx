// Arquivo adaptado para uso com TailwindCSS e sem react-bootstrap

import React, { useEffect, useState } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
//import Select from "../../components/form/Select.tsx";
import Select from "react-select";
import DatePicker from "../../components/form/date-picker";
import TextArea from "../../components/form/input/TextArea";


import { calcularIdade, formatDateBrShort } from '../../helpers';

import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';
import api from '../../services/api';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import debounce from 'lodash/debounce';

export default function ConsultasLista() {
  //const [message, setMessage] = useState("");
  const { isOpen, openModal, closeModal } = useModal();
  const [consultas, setConsultas] = useState([]);
  const [filtros, setFiltros] = useState({ nomePaciente: '', nomeProfissional: '', status: '' });
  const [consultaSelecionada, setConsultaSelecionada] = useState(null);
  const [formData, setFormData] = useState({ pacienteId: '', profissionalId: '', data: '', hora: '', status: 'Agendado', obs: '' });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [sugestoesPacientes, setSugestoesPacientes] = useState([]);
  const [sugestoesProfissionais, setSugestoesProfissionais] = useState([]);

  const registrosPorPagina = 10;

  const options = [
    { value: "Agendado", label: "Agendado" },
    { value: "Cancelado", label: "Cancelado" },
    { value: "Confirmado", label: "Confrmado" },
    { value: "Realizado", label: "Realizado" },
  ];

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
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
    setConsultaSelecionada(null);
  };

  const handleSave = async () => {
    const dataCompleta = `${formData.data}T${formData.hora}:00.000Z`;
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
      (!filtros.nomeProfissional || c.nome_profissional?.toLowerCase().includes(filtros.nomeProfissional.toLowerCase())) &&
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

  const totalPaginas = Math.ceil(consultasFiltradas.length / registrosPorPagina);

  return (
    <>

      <PageMeta
        title="OdontoSys | Dashboard de Clínica Odontológica em React.js"
        description="Esta é a página do Dashboard da Clínica Odontológica OdontoSys, desenvolvido com React.js e Tailwind CSS"
      />
      <PageBreadcrumb pageTitle="Consultas" />


      <div className="p-6">

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input className="border rounded px-3 py-2" placeholder="Paciente" value={filtros.nomePaciente} onChange={e => setFiltros({ ...filtros, nomePaciente: e.target.value })} />
          <input className="border rounded px-3 py-2" placeholder="Profissional" value={filtros.nomeProfissional} onChange={e => setFiltros({ ...filtros, nomeProfissional: e.target.value })} />
          <select className="border rounded px-3 py-2" value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })}>
            <option value="">Todos os status</option>
            <option value="Agendado">Agendado</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Cancelado">Cancelado</option>
            <option value="Realizado">Realizado</option>
          </select>
        </div>

        {/* Botoes */}
        <div className="flex justify-end gap-2 mb-4">
          <button onClick={() => { exportarExcel() }} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Exportar Excel</button>
          <button onClick={() => { exportarPDF() }} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">Exportar PDF</button>
          <button onClick={() => openModal()} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><FaPlus /> Nova Consulta</button>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-blue-500 text-white">
              <tr>
                <th className="px-2 py-1 border">#</th>
                <th className="px-2 py-1 border">Codigo</th>
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
                  <td className="px-2 py-1 border">{c.codigo}</td>
                  <td className="px-2 py-1 border">{c.nome_paciente}</td>
                  <td className="px-2 py-1 border">{c.dataNascimento ? calcularIdade(c.dataNascimento) : '-'}</td>
                  <td className="px-2 py-1 border">{c.convenio || '-'}</td>
                  <td className="px-2 py-1 border">{c.nome_profissional}</td>
                  <td className="px-2 py-1 border">{c.especialidades || '-'}</td>
                  <td className="px-2 py-1 border">{c.departamentos || '-'}</td>
                  <td className="px-2 py-1 border">{formatDateBrShort(c.data)}</td>
                  <td className="px-2 py-1 border">{c.hora}</td>
                  <td className="px-2 py-1 border">{c.situacao}</td>
                  <td className="px-2 py-1 border text-center space-x-2">
                    <button className="text-blue-600 hover:underline" onClick={() => handleOpenModal(c)}><FaEdit /></button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(c.id)}><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginacao       */}
        <div className="flex justify-between items-center mt-4">
          <span>Página {paginaAtual} de {totalPaginas}</span>
          <div className="space-x-2">
            <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={paginaAtual === 1} onClick={() => setPaginaAtual(p => p - 1)}>Anterior</button>
            <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual(p => p + 1)}>Próxima</button>
          </div>
        </div>

        {/* Moda;        */}
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[584px] p-5 lg:p-10">
          <form className="">
            <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
              Personal Information
            </h4>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <div className="col-span-1">
                <Label>Pacientes</Label>
                <Input type="text"
                  value={formData.pacienteId || ''}
                  onChange={(e) => { const nome = e.target.value; setFormData({ ...formData, pacienteId: nome }); buscarPacientes(nome); }}
                  //list="listaPacientes"
                  placeholder="Digite para buscar" />
                <datalist id="listaPacientes">
                  {sugestoesPacientes.map((p) => (
                    <option key={p.id} value={p.nome} onClick={() => setFormData({ ...formData, pacienteId: p.id })} />
                  ))}
                </datalist>
              </div>

              <div className="col-span-1">
                <Label>Profissionais</Label>
                <Input type="text"
                  value={formData.profissionalId || ''}
                  onChange={(e) => { const nome = e.target.value; setFormData({ ...formData, profissionalId: nome }); buscarProfissionais(nome); }}
                  //list="listaProfissionais"
                  placeholder="Digite para buscar" />
                <datalist id="listaProfissionais">
                  {sugestoesProfissionais.map((p) => (
                    <option key={p.id} value={p.nome} onClick={() => setFormData({ ...formData, profissionalId: p.id })} />
                  ))}
                </datalist>
              </div>

              <div className="col-span-1">
                {/* <Label>Data</Label> */}
                <DatePicker
                  id="date-picker"
                  label="Data"
                  placeholder="Select a date"
                  //onChange={(dates, currentDateString) => { console.log({ dates, currentDateString }); }}
                  value={formData.data}
                  onChange={e => setFormData({ ...formData, data: e.target.value })}
                />
              </div>

              <div className="col-span-1">
                <div className="relative">
                  <Label htmlFor='tm'>Hora</Label>
                  <Input
                    type="time"
                    id="tm"
                    name="tm"
                    //onChange={(e) => console.log(e.target.value)} 
                    value={formData.hora}
                    onChange={e => setFormData({ ...formData, hora: e.target.value })}
                  />

                  {/* <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <BiTimeFive className="size-6" />
                  </span> */}
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label>Status</Label>
                <Select
                  options={options}
                  placeholder="Select Option"
                  //onChange={handleSelectChange}
                  className="dark:bg-dark-900"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label>Observações</Label>
                <TextArea
                  rows={6}
                  value={formData.obs}
                  onChange={e => setFormData({ ...formData, obs: e.target.value })}
                />
              </div>

            </div>

            <div className="flex items-center justify-end w-full gap-3 mt-6">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

      </div>


    </>

  );
}
