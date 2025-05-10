import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import esLocale from '@fullcalendar/core/locales/pt-br';
import api from '../../services/api';

const Agendamentos = () => {
    const [eventos, setEventos] = useState([]);
    const [filtroPaciente, setFiltroPaciente] = useState('');
    const [filtroProfissional, setFiltroProfissional] = useState('');
    const [consultasOriginais, setConsultasOriginais] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        pacienteId: '',
        profissionalId: '',
        data: '',
        hora: '09:00',
        status: 'Agendado',
        obs: ''
    });

    useEffect(() => {
        carregarConsultas();
    }, []);

    const carregarConsultas = async () => {
        try {
            const res = await api.get('/consultas/vwcompleta');
            const eventosConvertidos = res.data.map((c) => ({
                id: c.id,
                title: `${c.nome_paciente} - ${c.nome_profissional}`,
                start: new Date(c.data_agendamento),
                end: new Date(new Date(c.data_agendamento).getTime() + 30 * 60000),
                allDay: false,
                backgroundColor: c.situacao === 'Cancelado' ? '#dc3545' :
                    c.situacao === 'Concluído' ? '#198754' :
                        c.situacao === 'Confirmado' ? '#ffc107' : '#0d6efd'
            }));
            setEventos(eventosConvertidos);
            setConsultasOriginais(res.data);
            setEventos(filtrarConsultas(res.data, filtroPaciente, filtroProfissional));
        } catch (error) {
            console.error('Erro ao carregar consultas:', error);
        }
    };

    const filtrarConsultas = (lista, pacienteFiltro, profissionalFiltro) => {
        return lista
            .filter((c) =>
                (!pacienteFiltro || c.nome_paciente.toLowerCase().includes(pacienteFiltro.toLowerCase())) &&
                (!profissionalFiltro || c.nome_profissional.toLowerCase().includes(profissionalFiltro.toLowerCase()))
            )
            .map((c) => ({
                id: c.id,
                title: `${c.nome_paciente} - ${c.nome_profissional}`,
                start: new Date(c.data_agendamento),
                end: new Date(new Date(c.data_agendamento).getTime() + 30 * 60000),
                allDay: false,
                backgroundColor:
                    c.situacao === 'Cancelado' ? '#dc3545' :
                        c.situacao === 'Concluído' ? '#198754' :
                            c.situacao === 'Confirmado' ? '#ffc107' : '#0d6efd'
            }));
    };

    const handleDateClick = (selected) => {
        setFormData({
            title: '',
            data: selected.startStr,
            hora: '09:00'
        });
        setShowModal(true);
    };

    const handleEventClick = (selected) => {
        if (
            window.confirm(
                `Você deseja apagar o evento? '${selected.event.title}'`
            )
        ) {
            selected.event.remove();
        }
    };

    const handleSaveConsulta = async () => {
        const dataCompleta = `${formData.data}T${formData.hora}:00.000Z`;
        const payload = {
            pacienteId: Number(formData.pacienteId),
            profissionalId: Number(formData.profissionalId),
            data: dataCompleta,
            status: formData.status,
            obs: formData.obs
        };

        try {
            await api.post('/agendamentos', payload);
            await carregarConsultas(); // atualiza eventos
            setShowModal(false);
        } catch (error) {
            console.error('Erro ao salvar consulta:', error);
            alert('Erro ao salvar consulta');
        }
    };

    return (
        <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Filtrar por paciente"
                    value={filtroPaciente}
                    onChange={(e) => {
                        const valor = e.target.value;
                        setFiltroPaciente(valor);
                        setEventos(filtrarConsultas(consultasOriginais, valor, filtroProfissional));
                    }}
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded"
                />
                <input
                    type="text"
                    placeholder="Filtrar por profissional"
                    value={filtroProfissional}
                    onChange={(e) => {
                        const valor = e.target.value;
                        setFiltroProfissional(valor);
                        setEventos(filtrarConsultas(consultasOriginais, filtroPaciente, valor));
                    }}
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded"
                />
            </div>

            <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

                <div className="custom-calendar">
                    <FullCalendar
                        height="75vh"
                        locale={esLocale}
                        firstDay={7}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                        headerToolbar={{
                            left: "prev,next,today",
                            center: "title",
                            right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
                        }}
                        initialView="dayGridMonth"
                        editable={true}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        select={handleDateClick}
                        eventClick={handleEventClick}
                        events={eventos}
                    />
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
                        <h2 className="text-xl font-semibold mb-4">Nova Consulta</h2>

                        <div className="space-y-3">
                            <input
                                type="number"
                                placeholder="Paciente ID"
                                value={formData.pacienteId}
                                onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <input
                                type="number"
                                placeholder="Profissional ID"
                                value={formData.profissionalId}
                                onChange={(e) => setFormData({ ...formData, profissionalId: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <input
                                type="date"
                                value={formData.data}
                                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <input
                                type="time"
                                value={formData.hora}
                                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <textarea
                                rows={3}
                                placeholder="Observações"
                                value={formData.obs}
                                onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveConsulta}
                                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agendamentos;
