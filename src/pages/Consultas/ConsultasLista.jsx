import React, { useEffect, useState } from 'react';
import { Table, Button, Container, Modal, Form, Row, Col } from 'react-bootstrap';
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
    const dataCompleta = `${formData.data}T${formData.hora}:00.000Z`;
    const payload = { ...formData, data: dataCompleta };
    try {
      if (consultaSelecionada) {
        await api.put(`/consultas/${consultaSelecionada.id}`, payload);
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
        await api.delete(`/consultas/${id}`);
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
      const res = await api.get(`/pacientes?search=${termo}`);
      setSugestoesPacientes(res.data);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  }, 500);

  const buscarProfissionais = debounce(async (termo) => {
    try {
      const res = await api.get(`/profissionais?search=${termo}`);
      setSugestoesProfissionais(res.data);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
    }
  }, 500);


  const totalPaginas = Math.ceil(consultasFiltradas.length / registrosPorPagina);

  return (
    <Container className="mt-4">
      <h4>Consultas</h4>

      <Row className="mb-3">
        <Col><Form.Control placeholder="Paciente" value={filtros.nomePaciente} onChange={e => setFiltros({ ...filtros, nomePaciente: e.target.value })} /></Col>
        <Col><Form.Control placeholder="Profissional" value={filtros.nomeProfissional} onChange={e => setFiltros({ ...filtros, nomeProfissional: e.target.value })} /></Col>
        <Col><Form.Select value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })}>
          <option value="">Todos os status</option>
          <option value="Agendado">Agendado</option>
          <option value="Concluído">Concluído</option>
          <option value="Cancelado">Cancelado</option>
        </Form.Select></Col>
      </Row>

      <div className="text-end mb-3 d-flex justify-content-end gap-2">
        <Button variant="success" onClick={exportarExcel}>Exportar Excel</Button>
        <Button variant="danger" onClick={exportarPDF}>Exportar PDF</Button>
        <Button variant="primary" onClick={() => handleOpenModal()}><FaPlus /> Nova Consulta</Button>
      </div>


      <Table striped bordered hover responsive>
        <thead className="bg-primary text-white">
          <tr>
            <th>#</th>
            <th>Paciente</th>
            <th>Idade</th>
            <th>Convênio</th>
            <th>Profissional</th>
            <th>Especialidades</th>
            <th>Departamento</th>
            <th>Data</th>
            <th>Hora</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {consultasPaginadas.map((c, index) => (
            <tr key={c.id}>
              <td>{index + 1}</td>
              <td>{c.nome_paciente}</td>
              <td>{c.dataNascimento ? calcularIdade(c.dataNascimento) : '-'}</td>
              <td>{c.convenio || '-'}</td>
              <td>{c.nome_profissional}</td>
              <td>{c.especialidades || '-'}</td>
              <td>{c.departamentos || '-'}</td>
              <td>{new Date(c.data_agendamento).toLocaleDateString()}</td>
              <td>{new Date(c.data_agendamento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td>{c.situacao}</td>
              <td className="d-flex gap-2 justify-content-center">
                <Button size="sm" variant="outline-primary" onClick={() => handleOpenModal(c)}><FaEdit /></Button>
                <Button size="sm" variant="outline-danger" onClick={() => handleDelete(c.id)}><FaTrash /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="d-flex justify-content-between align-items-center">
        <span>Página {paginaAtual} de {totalPaginas}</span>
        <div>
          <Button size="sm" disabled={paginaAtual === 1} onClick={() => setPaginaAtual(p => p - 1)}>Anterior</Button>{' '}
          <Button size="sm" disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual(p => p + 1)}>Próxima</Button>
        </div>
      </div>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton><Modal.Title>Consulta</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>

            <Form.Group className="mb-2">
              <Form.Label>Paciente</Form.Label>
              <Form.Control
                type="text"
                value={formData.nomePaciente || ''}
                onChange={(e) => {
                  const nome = e.target.value;
                  setFormData({ ...formData, nomePaciente: nome });
                  buscarPacientes(nome);
                }}
                list="listaPacientes"
                placeholder="Digite para buscar"
              />
              <datalist id="listaPacientes">
                {sugestoesPacientes.map((p) => (
                  <option key={p.id} value={p.nome} onClick={() => setFormData({ ...formData, pacienteId: p.id })} />
                ))}
              </datalist>
            </Form.Group>


            <Form.Group className="mb-2">
              <Form.Label>Profissional</Form.Label>
              <Form.Control
                type="text"
                value={formData.nomeProfissional || ''}
                onChange={(e) => {
                  const nome = e.target.value;
                  setFormData({ ...formData, nomeProfissional: nome });
                  buscarProfissionais(nome);
                }}
                list="listaProfissionais"
                placeholder="Digite para buscar"
              />
              <datalist id="listaProfissionais">
                {sugestoesProfissionais.map((p) => (
                  <option key={p.id} value={p.nome} onClick={() => setFormData({ ...formData, profissionalId: p.id })} />
                ))}
              </datalist>
            </Form.Group>


            <Form.Group className="mb-2">
              <Form.Label>Data</Form.Label>
              <Form.Control type="date" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Hora</Form.Label>
              <Form.Control type="time" value={formData.hora} onChange={e => setFormData({ ...formData, hora: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Status</Form.Label>
              <Form.Select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option>Agendado</option>
                <option>Concluído</option>
                <option>Cancelado</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Observações</Form.Label>
              <Form.Control as="textarea" rows={2} value={formData.obs} onChange={e => setFormData({ ...formData, obs: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>Salvar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
