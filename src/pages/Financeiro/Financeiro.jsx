// Componente Financeiro com filtros dinâmicos, gráficos, exportações e CRUD
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  Container, Card, Table, Form, Row, Col,
  Button, Spinner, Modal
} from 'react-bootstrap';
import ContentHeader from '../../components/share/ContentHeader';
import Select from 'react-select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Financeiro = () => {
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState(null);
  const [pacientesOptions, setPacientesOptions] = useState([]);
  const [profissionaisOptions, setProfissionaisOptions] = useState([]);
  const [filtro, setFiltro] = useState({ pacienteId: null, profissionalId: null, dataInicio: '', dataFim: '' });

  const [novoPagamento, setNovoPagamento] = useState({
    pacienteId: '', profissionalId: '', valor: '', tipoPagamento: '', status: '', data: '', registeredBy: 1
  });

  const cores = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  const pagamentosFiltrados = pagamentos.filter(p => {
    const matchPaciente = !filtro.pacienteId || p.pacienteId === filtro.pacienteId;
    const matchProfissional = !filtro.profissionalId || p.profissionalId === filtro.profissionalId;
    const matchData = (!filtro.dataInicio || new Date(p.data) >= new Date(filtro.dataInicio)) && (!filtro.dataFim || new Date(p.data) <= new Date(filtro.dataFim));
    return matchPaciente && matchProfissional && matchData;
  });

  const dadosTipo = Object.entries(pagamentosFiltrados.reduce((acc, p) => {
    acc[p.tipoPagamento] = (acc[p.tipoPagamento] || 0) + p.valor;
    return acc;
  }, {})).map(([tipo, valor]) => ({ name: tipo, value: valor }));

  const dadosStatus = Object.entries(pagamentosFiltrados.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + p.valor;
    return acc;
  }, {})).map(([status, valor]) => ({ name: status, value: valor }));

  const totalGeral = pagamentosFiltrados.reduce((sum, p) => sum + p.valor, 0);
  const totalPago = pagamentosFiltrados.filter(p => p.status === 'Pago').reduce((sum, p) => sum + p.valor, 0);
  const totalPendente = pagamentosFiltrados.filter(p => p.status === 'Pendente').reduce((sum, p) => sum + p.valor, 0);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  const totalPaginas = Math.ceil(pagamentosFiltrados.length / itensPorPagina);
  const [ordenacao, setOrdenacao] = useState({ campo: '', direcao: 'asc' });

  const pagamentosOrdenados = [...pagamentosFiltrados].sort((a, b) => {
    const { campo, direcao } = ordenacao;
    if (!campo) return 0;

    let valA = a[campo];
    let valB = b[campo];

    if (campo === 'data') {
      valA = new Date(valA);
      valB = new Date(valB);
    } else if (campo === 'valor') {
      valA = parseFloat(valA);
      valB = parseFloat(valB);
    } else {
      valA = valA?.toString().toLowerCase();
      valB = valB?.toString().toLowerCase();
    }

    if (valA < valB) return direcao === 'asc' ? -1 : 1;
    if (valA > valB) return direcao === 'asc' ? 1 : -1;
    return 0;
  });

  const pagamentosPaginados = pagamentosOrdenados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const quantidadePagamentos = pagamentosFiltrados.length;

  useEffect(() => {
    buscarPagamentos();
    carregarPacientes();
    carregarProfissionais();
  }, []);

  const buscarPagamentos = async () => {
    try {
      const response = await api.get('/pagamentos');
      setPagamentos(response.data);
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarPacientes = async () => {
    try {
      const response = await api.get('/pacientes');
      const options = response.data.map(p => ({ value: p.id, label: `${p.nome} (#${p.id})` }));
      setPacientesOptions(options);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    }
  };

  const carregarProfissionais = async () => {
    try {
      const response = await api.get('/profissionais');
      const options = response.data.map(p => ({ value: p.id, label: `${p.nome} (#${p.id})` }));
      setProfissionaisOptions(options);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  };

  const abrirModalNovo = () => {
    setNovoPagamento({ pacienteId: '', profissionalId: '', valor: '', tipoPagamento: '', status: '', data: '', registeredBy: 1 });
    setModoEdicao(false);
    setShowModal(true);
  };

  const handleEditarPagamento = (pagamento) => {
    setNovoPagamento({
      pacienteId: pagamento.pacienteId,
      profissionalId: pagamento.profissionalId,
      valor: pagamento.valor,
      tipoPagamento: pagamento.tipoPagamento,
      status: pagamento.status,
      data: pagamento.data.split('T')[0],
      registeredBy: pagamento.registeredBy
    });
    setPagamentoSelecionado(pagamento);
    setModoEdicao(true);
    setShowModal(true);
  };

  const handleExcluirPagamento = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este pagamento?')) {
      try {
        await api.delete(`/pagamentos/${id}`);
        buscarPagamentos();
      } catch (error) {
        console.error('Erro ao excluir pagamento:', error);
      }
    }
  };

  const handleSalvarPagamento = async () => {
    try {
      const payload = {
        ...novoPagamento,
        pacienteId: parseInt(novoPagamento.pacienteId),
        profissionalId: parseInt(novoPagamento.profissionalId),
        valor: parseFloat(novoPagamento.valor),
        data: new Date(novoPagamento.data).toISOString(),
        registeredBy: 1
      };

      if (modoEdicao && pagamentoSelecionado) {
        await api.put(`/pagamentos/${pagamentoSelecionado.id}`, payload);
      } else {
        await api.post('/pagamentos', payload);
      }

      setShowModal(false);
      setPagamentoSelecionado(null);
      buscarPagamentos();
    } catch (error) {
      console.error('Erro ao salvar pagamento:', error);
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Paciente', 'Profissional', 'Valor', 'Data', 'Tipo', 'Status']],
      body: pagamentosFiltrados.map(p => [
        p.paciente?.nome || `#${p.pacienteId}`,
        p.profissional?.nome || `#${p.profissionalId}`,
        formatarValor(p.valor),
        formatarData(p.data),
        p.tipoPagamento,
        p.status
      ])
    });
    doc.save('pagamentos.pdf');
  };

  const exportarExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(pagamentosFiltrados.map(p => ({
      Paciente: p.paciente?.nome || `#${p.pacienteId}`,
      Profissional: p.profissional?.nome || `#${p.profissionalId}`,
      Valor: p.valor,
      Data: formatarData(p.data),
      Tipo: p.tipoPagamento,
      Status: p.status
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagamentos');
    XLSX.writeFile(workbook, 'pagamentos.xlsx');
  };

  const atualizarStatus = async (id, novoStatus) => {
    try {
      await api.put(`/pagamentos/${id}`, { status: novoStatus });
      buscarPagamentos();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const mudarPagina = (novaPagina) => {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      setPaginaAtual(novaPagina);
    }
  };

  const ordenar = (campo) => {
    setOrdenacao((prev) => {
      const direcao = prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc';
      return { campo, direcao };
    });
  };

  const renderSetaOrdenacao = (campo) => {
    if (ordenacao.campo !== campo) return '';
    return ordenacao.direcao === 'asc' ? ' 🔼' : ' 🔽';
  };

  const formatarData = (data) => new Date(data).toLocaleDateString('pt-BR');
  const formatarValor = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Container>
      <ContentHeader title="Financeiro" />

      <Row className="mb-3">
        <Col md={4}>
          <Card className="text-center p-3">
            <h6>Total Geral</h6>
            <h5>{formatarValor(totalGeral)}</h5>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center p-3">
            <h6>Total Pago</h6>
            <h5 className="text-success">{formatarValor(totalPago)}</h5>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center p-3">
            <h6>Pagamentos Encontrados</h6>
            <h5>{quantidadePagamentos}</h5>
          </Card>
        </Col>
      </Row>

      <Form className="mb-3">
        <Row>
          <Col md={4}>
            <Form.Label>Paciente</Form.Label>
            <Select options={pacientesOptions} isClearable onChange={(opt) => setFiltro(prev => ({ ...prev, pacienteId: opt?.value || null }))} />
          </Col>
          <Col md={4}>
            <Form.Label>Profissional</Form.Label>
            <Select options={profissionaisOptions} isClearable onChange={(opt) => setFiltro(prev => ({ ...prev, profissionalId: opt?.value || null }))} />
          </Col>
          <Col md={4}>
            <Form.Label>Período</Form.Label>
            <Row>
              <Col><Form.Control type="date" onChange={e => setFiltro(prev => ({ ...prev, dataInicio: e.target.value }))} /></Col>
              <Col><Form.Control type="date" onChange={e => setFiltro(prev => ({ ...prev, dataFim: e.target.value }))} /></Col>
            </Row>
          </Col>
        </Row>
      </Form>

      <Row className="mb-3">
        <Col md={6}>
          <Card className="p-3">
            <h6>Total por Tipo de Pagamento</h6>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dadosTipo} dataKey="value" nameKey="name" outerRadius={70}>
                  {dadosTipo.map((entry, index) => <Cell key={index} fill={cores[index % cores.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="p-3">
            <h6>Total por Status</h6>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dadosStatus}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card className="p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h5>Pagamentos</h5>
          <div>
            <Button variant="outline-success" size="sm" className="me-2" onClick={exportarExcel}>Exportar Excel</Button>
            <Button variant="outline-danger" size="sm" className="me-2" onClick={exportarPDF}>Exportar PDF</Button>
            <Button onClick={abrirModalNovo}>Incluir +</Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Spinner animation="border" className="d-block mx-auto" />
      ) : (
        <>
          <Table striped bordered hover responsive size="sm">
            <thead>
              <tr>
                <th onClick={() => ordenar('pacienteId')} style={{ cursor: 'pointer' }}>Paciente{renderSetaOrdenacao('pacienteId')}</th>
                <th onClick={() => ordenar('profissionalId')} style={{ cursor: 'pointer' }}>Profissional{renderSetaOrdenacao('profissionalId')}</th>
                <th onClick={() => ordenar('valor')} style={{ cursor: 'pointer' }}>Valor{renderSetaOrdenacao('valor')}</th>
                <th onClick={() => ordenar('data')} style={{ cursor: 'pointer' }}>Data{renderSetaOrdenacao('data')}</th>
                <th onClick={() => ordenar('tipoPagamento')} style={{ cursor: 'pointer' }}>Tipo{renderSetaOrdenacao('tipoPagamento')}</th>
                <th onClick={() => ordenar('status')} style={{ cursor: 'pointer' }}>Status{renderSetaOrdenacao('status')}</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagamentosPaginados.map((p) => (
                <tr key={p.id}>
                  <td>{p.paciente?.nome || `#${p.pacienteId}`}</td>
                  <td>{p.profissional?.nome || `#${p.profissionalId}`}</td>
                  <td>{formatarValor(p.valor)}</td>
                  <td>{formatarData(p.data)}</td>
                  <td>{p.tipoPagamento}</td>
                  <td className={p.status === 'Pago' ? 'text-success fw-bold' : 'text-warning fw-bold'}>{p.status}</td>
                  <td>
                    <Button variant="outline-primary" size="sm" onClick={() => handleEditarPagamento(p)} className="me-2">✏️</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleExcluirPagamento(p.id)} className="me-2">🗑️</Button>
                    {p.status === 'Pendente' && (
                      <Button variant="outline-success" size="sm" onClick={() => atualizarStatus(p.id, 'Pago')} title="Marcar como Pago">✅</Button>
                    )}
                    {p.status === 'Pago' && (
                      <Button variant="outline-warning" size="sm" onClick={() => atualizarStatus(p.id, 'Pendente')} title="Marcar como Pendente">🚫</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center">
            <div className="mt-2">
              <strong>Total Geral:</strong> {formatarValor(totalGeral)} |{' '}
              <strong>Pago:</strong> <span className="text-success">{formatarValor(totalPago)}</span> |{' '}
              <strong>Pendente:</strong> <span className="text-warning">{formatarValor(totalPendente)}</span>
            </div>
            <div className="mt-2">
              <Button variant="light" size="sm" onClick={() => mudarPagina(paginaAtual - 1)} disabled={paginaAtual === 1}>Anterior</Button>{' '}
              <span className="mx-2">Página {paginaAtual} de {totalPaginas}</span>{' '}
              <Button variant="light" size="sm" onClick={() => mudarPagina(paginaAtual + 1)} disabled={paginaAtual === totalPaginas}>Próxima</Button>
            </div>
          </div>
        </>
      )}


      {/* Modal de cadastro/edição permanece o mesmo */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{modoEdicao ? 'Editar Pagamento' : 'Novo Pagamento'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-2">
              <Col>
                <Form.Label>Paciente</Form.Label>
                <Select
                  options={pacientesOptions}
                  value={pacientesOptions.find(opt => opt.value === novoPagamento.pacienteId) || null}
                  onChange={(opt) => setNovoPagamento(prev => ({ ...prev, pacienteId: opt?.value }))}
                />
              </Col>
              <Col>
                <Form.Label>Profissional</Form.Label>
                <Select
                  options={profissionaisOptions}
                  value={profissionaisOptions.find(opt => opt.value === novoPagamento.profissionalId) || null}
                  onChange={(opt) => setNovoPagamento(prev => ({ ...prev, profissionalId: opt?.value }))}
                />
              </Col>
            </Row>
            <Row className="mb-2">
              <Col>
                <Form.Label>Valor</Form.Label>
                <Form.Control type="number" value={novoPagamento.valor} onChange={(e) => setNovoPagamento({ ...novoPagamento, valor: e.target.value })} />
              </Col>
              <Col>
                <Form.Label>Data</Form.Label>
                <Form.Control type="date" value={novoPagamento.data} onChange={(e) => setNovoPagamento({ ...novoPagamento, data: e.target.value })} />
              </Col>
            </Row>
            <Row className="mb-2">
              <Col>
                <Form.Label>Tipo de Pagamento</Form.Label>
                <Form.Select value={novoPagamento.tipoPagamento} onChange={(e) => setNovoPagamento({ ...novoPagamento, tipoPagamento: e.target.value })}>
                  <option value="">Selecione</option>
                  <option value="Particular">Particular</option>
                  <option value="Convênio">Convênio</option>
                  <option value="Comissão">Comissão</option>
                </Form.Select>
              </Col>
              <Col>
                <Form.Label>Status</Form.Label>
                <Form.Select value={novoPagamento.status} onChange={(e) => setNovoPagamento({ ...novoPagamento, status: e.target.value })}>
                  <option value="">Selecione</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                </Form.Select>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSalvarPagamento}>Salvar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Financeiro;
