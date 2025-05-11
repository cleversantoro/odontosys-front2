import React, { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import ReactApexChart from "react-apexcharts";
import api from "../../services/api";

export default function DashboardDespesas() {
  const [total, setTotal] = useState(0);
  const [porCategoria, setPorCategoria] = useState([]);
  const [porData, setPorData] = useState([]);

  useEffect(() => {
    api.get('/despesas')
      .then((res) => processaDados(res.data))
      .catch((error) => console.error('Erro ao buscar despesas:', error));
  }, []);

  const processaDados = (data) => {
    const totalGasto = data.reduce((acc, curr) => acc + curr.valor, 0);
    setTotal(totalGasto.toFixed(2));

    const agrupadoCategoria = data.reduce((acc, curr) => {
      acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.valor;
      return acc;
    }, {});
    setPorCategoria(Object.entries(agrupadoCategoria).map(([name, value]) => ({ name, value })));

    const agrupadoData = data.reduce((acc, curr) => {
      const dia = new Date(curr.data).toLocaleDateString('pt-BR');
      acc[dia] = (acc[dia] || 0) + curr.valor;
      return acc;
    }, {});
    setPorData(Object.entries(agrupadoData).map(([data, valor]) => ({ data, valor })));
  };

  const pieOptions = {
    chart: { type: 'pie' },
    labels: porCategoria.map(c => c.name),
    legend: {
      position: 'bottom'
    }
  };

  const lineOptions = {
    chart: { type: 'line' },
    xaxis: {
      categories: porData.map(d => d.data),
      labels: { rotate: -45 }
    },
    stroke: { curve: 'smooth' },
    tooltip: {
      y: {
        formatter: (val) => `R$ ${val.toFixed(2)}`
      }
    }
  };

  return (
    <>
      <PageMeta
        title="OdontoSys | Dashboard de Clínica Odontológica em React.js"
        description="Esta é a página do Dashboard da Clínica Odontológica OdontoSys, desenvolvido com React.js e Tailwind CSS"
      />
      <PageBreadcrumb pageTitle="DashBoard de Despesas" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px] text-center"></div>

        <div className="p-4 border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">

          <div className="bg-white p-6 rounded shadow mb-6">
            <p className="text-lg">💸 Total gasto no período: <span className="font-bold text-red-600">R$ {total}</span></p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-semibold mb-4">Distribuição por Categoria</h3>
              <ReactApexChart
                options={pieOptions}
                series={porCategoria.map(c => c.value)}
                type="pie"
                height={300}
              />
            </div>

            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-semibold mb-4">Gastos por Dia</h3>
              <ReactApexChart
                options={lineOptions}
                series={[{ name: 'Gastos', data: porData.map(d => d.valor) }]}
                type="line"
                height={300}
              />
            </div>
          </div>
          
        </div>

      </div>
    </>
  );
}
