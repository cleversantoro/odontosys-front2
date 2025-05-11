import React, { useState } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

//import { Container, Row, Col, Form, Button, Table, Modal } from 'react-bootstrap';
//import ContentHeader from '../../components/share/ContentHeader';
//import imgLogoBase64 from '../../app/img/logoBase64';
//import { gerarPDFMake } from './gerarPDFMake';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const Orcamento = () => {
    const [formData, setFormData] = useState({ orcamentoData: '', formasPagamento: '' });
    const [servicosSelecionados, setServicosSelecionados] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [novoServico, setNovoServico] = useState({ quantidade: 1, descricao: '', valor: 0 });

    const servicos = ["Extração", "Restauração", "Canal", "Limpeza", "Implante", "Outros"];

    const calcularTotal = () => servicosSelecionados.reduce((total, item) => total + (item.valor * item.quantidade), 0);

    const handleAdicionarServico = () => {
        setServicosSelecionados(prev => [...prev, novoServico]);
        setNovoServico({ quantidade: 1, descricao: '', valor: 0 });
        setShowModal(false);
    };

    const handleRemoverServico = (index) => {
        const listaAtualizada = [...servicosSelecionados];
        listaAtualizada.splice(index, 1);
        setServicosSelecionados(listaAtualizada);
    };

    const limparFormulario = () => {
        setFormData({ orcamentoData: '', formasPagamento: '' });
        setServicosSelecionados([]);
    };

    const gerarPDF = () => {
        const doc = new jsPDF();

        const gerarCabecalho = (via) => {
            doc.addImage(imgLogoBase64, 'PNG', 10, 8, 30, 30);

            doc.setFontSize(16);
            doc.text('Clínica Odontológica Sorriso Brilhante', 50, 20);
            doc.setFontSize(12);
            doc.text(`Orçamento Odontológico - Via: ${via}`, 50, 30);

            doc.setFontSize(10);
            doc.text(`Data: ${formData.orcamentoData}`, 10, 45);

            // Linha divisória
            doc.line(10, 50, 200, 50);
        };

        const gerarTabelaServicos = (yStart) => {
            if (servicosSelecionados.length === 0) return null;

            const tableResult =
                autoTable(doc, {
                    startY: yStart,
                    head: [['Quantidade', 'Serviço', 'Valor Unitário (R$)', 'Subtotal (R$)']],
                    body: servicosSelecionados.map(item => [
                        item.quantidade,
                        item.descricao,
                        item.valor.toFixed(2),
                        (item.quantidade * item.valor).toFixed(2),
                    ]),
                    theme: 'grid'
                });

            return tableResult;
        };

        const gerarRodape = (yStart) => {
            const total = calcularTotal().toFixed(2);
            doc.setFontSize(12);
            doc.text(`Total: R$ ${total}`, 10, yStart);

            doc.text('Formas de Pagamento:', 10, yStart + 10);
            doc.setFontSize(10);
            doc.text(formData.formasPagamento, 10, yStart + 20);

            // Espaço para assinatura
            doc.setFontSize(10);
            doc.text('Assinatura do Paciente: _______________________', 10, yStart + 40);
            doc.text('Assinatura da Clínica: _________________________', 10, yStart + 50);

            // Rodapé
            doc.setFontSize(8);
            doc.text('Clínica Odontológica Sorriso Brilhante - Tel: (11) 1234-5678', 10, 285);
        };

        const criarPaginaOrcamento = (via) => {
            gerarCabecalho(via);
            let yPosTabela = 55;
            const tabela = gerarTabelaServicos(yPosTabela);
            const yFinal = tabela?.finalY || (yPosTabela + 20); // se tabela não existir, soma um valor padrão
            gerarRodape(yFinal + 10);

        };

        // Via Paciente
        criarPaginaOrcamento('Paciente');

        // Via Clínica
        doc.addPage();
        criarPaginaOrcamento('Clínica');

        doc.save('orcamento_odontologico.pdf');
    };


    return (
        <>
            <PageMeta
                title="OdontoSys | Dashboard de Clínica Odontológica em React.js"
                description="Esta é a página do Dashboard da Clínica Odontológica OdontoSys, desenvolvido com React.js e Tailwind CSS"
            />
            <PageBreadcrumb pageTitle="Orçamento" />


            <div className="container mx-auto mt-4 p-4">
                <div className="flex items-end gap-4 mb-4">
                    <div className="flex-1">
                        <label className="block mb-1">Data</label>
                        <input
                            type="date"
                            className="border p-2 rounded w-full"
                            value={formData.orcamentoData}
                            onChange={(e) => setFormData(prev => ({ ...prev, orcamentoData: e.target.value }))}
                        />
                    </div>
                    <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={() => setShowModal(true)}>Incluir Serviço +</button>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={gerarPDF}>Gerar PDF</button>
                    <button className="px-4 py-2 bg-yellow-500 text-white rounded" onClick={limparFormulario}>Novo Orçamento</button>
                </div>

                <table className="w-full border-collapse border border-gray-300 mb-4">
                    <thead className="bg-blue-200">
                        <tr>
                            <th className="border border-gray-300 p-2">QUANT</th>
                            <th className="border border-gray-300 p-2">SERVIÇO</th>
                            <th className="border border-gray-300 p-2">VALOR (R$)</th>
                            <th className="border border-gray-300 p-2">SUBTOTAL (R$)</th>
                            <th className="border border-gray-300 p-2">AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {servicosSelecionados.length > 0 ? (
                            servicosSelecionados.map((item, index) => (
                                <tr key={index}>
                                    <td className="border border-gray-300 p-2 text-center">{item.quantidade}</td>
                                    <td className="border border-gray-300 p-2">{item.descricao}</td>
                                    <td className="border border-gray-300 p-2 text-right">{item.valor.toFixed(2)}</td>
                                    <td className="border border-gray-300 p-2 text-right">{(item.valor * item.quantidade).toFixed(2)}</td>
                                    <td className="border border-gray-300 p-2 text-center">
                                        <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => handleRemoverServico(index)}>Remover</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="border border-gray-300 p-4 text-center">Nenhum serviço adicionado</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="mb-4">
                    <h5 className="font-semibold">Total: R$ {calcularTotal().toFixed(2)}</h5>
                </div>

                <div className="mb-3">
                    <label className="block mb-1">Formas de Pagamento</label>
                    <textarea
                        rows={3}
                        className="border p-2 rounded w-full"
                        value={formData.formasPagamento}
                        onChange={(e) => setFormData(prev => ({ ...prev, formasPagamento: e.target.value }))}
                    />
                </div>
            </div>

        </>
    );
};

export default Orcamento;
