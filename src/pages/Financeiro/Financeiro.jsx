// Componente Financeiro com filtros dinâmicos, gráficos, exportações e CRUD
import React, { useEffect, useState } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";

import api from '../../services/api';

import Select from 'react-select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BiCheckbox, BiCheckboxChecked, BiCheckboxMinus, BiPencil, BiTrash, BiUpArrow, BiDownArrow } from 'react-icons/bi';

const Financeiro = () => {
  const { isOpen, openModal, closeModal } = useModal();

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
    openModal();
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
    //setShowModal(true);
    openModal();
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
    return ordenacao.direcao === 'asc' ? <BiUpArrow className="size-3"/> : <BiDownArrow className="size-3"/> ;
  };

  const formatarData = (data) => new Date(data).toLocaleDateString('pt-BR');
  const formatarValor = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <>
      <PageMeta
        title="OdontoSys | Dashboard de Clínica Odontológica em React.js"
        description="Esta é a página do Dashboard da Clínica Odontológica OdontoSys, desenvolvido com React.js e Tailwind CSS"
      />
      <PageBreadcrumb pageTitle="Financeiro" />


      <div className="container mx-auto px-12 py-12">

        {/* Cards superiores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white shadow rounded p-4 text-center">
            <h6 className="text-sm font-semibold">Total Geral</h6>
            <h5 className="text-xl font-bold">{formatarValor(totalGeral)}</h5>
          </div>
          <div className="bg-white shadow rounded p-4 text-center">
            <h6 className="text-sm font-semibold">Total Pago</h6>
            <h5 className="text-xl font-bold text-green-500">{formatarValor(totalPago)}</h5>
          </div>
          <div className="bg-white shadow rounded p-4 text-center">
            <h6 className="text-sm font-semibold">Pagamentos Encontrados</h6>
            <h5 className="text-xl font-bold">{quantidadePagamentos}</h5>
          </div>
        </div>

        {/* Formulário de Filtros */}
        <div className="bg-white shadow rounded p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Paciente</label>
              <Select
                options={pacientesOptions}
                isClearable
                onChange={(opt) => setFiltro(prev => ({ ...prev, pacienteId: opt?.value || null }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Profissional</label>
              <Select
                options={profissionaisOptions}
                isClearable
                onChange={(opt) => setFiltro(prev => ({ ...prev, profissionalId: opt?.value || null }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Período</label>
              <div className="flex gap-2">
                <input type="date" className="border px-2 py-1 rounded w-full"
                  onChange={e => setFiltro(prev => ({ ...prev, dataInicio: e.target.value }))} />
                <input type="date" className="border px-2 py-1 rounded w-full"
                  onChange={e => setFiltro(prev => ({ ...prev, dataFim: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white shadow rounded p-4">
            <h6 className="text-center font-semibold mb-2">Total por Tipo de Pagamento</h6>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dadosTipo} dataKey="value" nameKey="name" outerRadius={70}>
                  {dadosTipo.map((entry, index) => (
                    <Cell key={index} fill={cores[index % cores.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white shadow rounded p-4">
            <h6 className="text-center font-semibold mb-2">Total por Status</h6>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dadosStatus}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cabeçalho dos Pagamentos */}
        <div className="bg-white shadow rounded p-4 mb-4 flex justify-between items-center">
          <h5 className="text-lg font-semibold">Pagamentos</h5>
          <div className="flex gap-2">
            <button className="border border-green-500 text-green-500 hover:bg-green-500 hover:text-white rounded px-3 py-1 text-sm"
              onClick={exportarExcel}>Exportar Excel</button>
            <button className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded px-3 py-1 text-sm"
              onClick={exportarPDF}>Exportar PDF</button>
            <button className="bg-blue-500 text-white hover:bg-blue-600 rounded px-3 py-1 text-sm"
              onClick={abrirModalNovo}>Incluir +</button>
          </div>
        </div>

        {/* Loader */}
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Tabela de Pagamentos */}
            <div className="overflow-auto mb-2">
              <table className="w-full border-collapse table-auto text-sm">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    {['Paciente', 'Profissional', 'Valor', 'Data', 'Tipo', 'Status'].map((title, idx) => (
                      <th key={idx} className="border px-2 py-1 cursor-pointer"
                        onClick={() => ordenar(['pacienteId', 'profissionalId', 'valor', 'data', 'tipoPagamento', 'status'][idx])}>

                        {title}{renderSetaOrdenacao(['pacienteId', 'profissionalId', 'valor', 'data', 'tipoPagamento', 'status'][idx])}

                      </th>
                    ))}
                    <th className="border px-2 py-1">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentosPaginados.map((p) => (
                    <tr key={p.id} className="text-center" >
                      <td className="border px-2 py-1">{p.paciente?.nome || `#${p.pacienteId}`}</td>
                      <td className="border px-2 py-1">{p.profissional?.nome || `#${p.profissionalId}`}</td>
                      <td className="border px-2 py-1">{formatarValor(p.valor)}</td>
                      <td className="border px-2 py-1">{formatarData(p.data)}</td>
                      <td className="border px-2 py-1">{p.tipoPagamento}</td>
                      <td className={`border px-2 py-1 font-semibold ${p.status === 'Pago' ? 'text-green-500' : 'text-yellow-500'}`}>{p.status}</td>

                      <td className="border px-2 py-1 flex justify-center gap-1">
                        <button className="text-blue-600 hover:text-blue-700 hover:underline" onClick={() => handleEditarPagamento(p)}><BiPencil className="size-5" /></button>
                        <button className="text-red-600 hover:text-red-700 hover:underline" onClick={() => handleExcluirPagamento(p.id)}><BiTrash className="size-5" /></button>

                        {p.status === 'Pendente' && (
                          <button className="text-yellow-500" onClick={() => atualizarStatus(p.id, 'Pago')}><BiCheckbox className="size-6" /></button>
                        )}

                        {p.status === 'Pago' && (
                          <button className="text-green-500" onClick={() => atualizarStatus(p.id, 'Pendente')}><BiCheckboxChecked className="size-6" /></button>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação e Totais */}
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <strong>Total Geral:</strong> {formatarValor(totalGeral)} |{' '}
                <strong>Pago:</strong> <span className="text-green-500">{formatarValor(totalPago)}</span> |{' '}
                <strong>Pendente:</strong> <span className="text-yellow-500">{formatarValor(totalPendente)}</span>
              </div>
              <div className="text-sm">
                <button className="border rounded px-2" disabled={paginaAtual === 1}
                  onClick={() => mudarPagina(paginaAtual - 1)}>Anterior</button>
                <span className="mx-2">Página {paginaAtual} de {totalPaginas}</span>
                <button className="border rounded px-2" disabled={paginaAtual === totalPaginas}
                  onClick={() => mudarPagina(paginaAtual + 1)}>Próxima</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de cadastro/edição permanece o mesmo */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[584px] p-5 lg:p-10">
        {/* {showModal && ( */}

        <form className="">
          <div className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
            <h3 className="text-lg font-semibold">{modoEdicao ? 'Editar Pagamento' : 'Novo Pagamento'}</h3>
            {/* <button onClick={() => closeModal()} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button> */}
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Paciente</label>
              <Select
                options={pacientesOptions}
                value={pacientesOptions.find(opt => opt.value === novoPagamento.pacienteId) || null}
                onChange={(opt) => setNovoPagamento(prev => ({ ...prev, pacienteId: opt?.value }))}
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Profissional</label>
              <Select
                options={profissionaisOptions}
                value={profissionaisOptions.find(opt => opt.value === novoPagamento.profissionalId) || null}
                onChange={(opt) => setNovoPagamento(prev => ({ ...prev, profissionalId: opt?.value }))}
              />
            </div>

            {/* </div> */}

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Valor</label>
              <input
                type="number"
                value={novoPagamento.valor}
                onChange={(e) => setNovoPagamento({ ...novoPagamento, valor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Data</label>
              <input
                type="date"
                value={novoPagamento.data}
                onChange={(e) => setNovoPagamento({ ...novoPagamento, data: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            </div>

            {/* </div> */}

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Tipo de Pagamento</label>
              <select
                value={novoPagamento.tipoPagamento}
                onChange={(e) => setNovoPagamento({ ...novoPagamento, tipoPagamento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                <option value="">Selecione</option>
                <option value="Particular">Particular</option>
                <option value="Convênio">Convênio</option>
                <option value="Comissão">Comissão</option>
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={novoPagamento.status}
                onChange={(e) => setNovoPagamento({ ...novoPagamento, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                <option value="">Selecione</option>
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
              </select>
            </div>

          </div>

          {/* </div> */}

          <div className="flex items-center justify-end w-full gap-3 mt-6">

            <button onClick={() => closeModal(false)} className="bg-gray-400 text-white hover:bg-gray-500 px-4 py-2 rounded-md">
              Cancelar
            </button>

            <button
              onClick={handleSalvarPagamento} className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-md">
              Salvar
            </button>

          </div>
        </form>

        {/* )} */}
      </Modal>

    </>
  );
};

export default Financeiro;
