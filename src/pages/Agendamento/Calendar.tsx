import { useState, useRef, useEffect } from "react";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import PageMeta from "../../components/common/PageMeta";

import esLocale from '@fullcalendar/core/locales/pt-br';
import api from '../../services/api';


interface CalendarEvent extends EventInput { extendedProps: { calendar: string; }; }
interface Consulta {
  id: number;
  nome_paciente: string;
  nome_profissional: string;
  data_agendamento: string;
  situacao: string;
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  //const [eventos, setEventos] = useState([]);
  const [filtroPaciente, setFiltroPaciente] = useState('');
  const [filtroProfissional, setFiltroProfissional] = useState('');
  const [consultasOriginais, setConsultasOriginais] = useState([]);
  //const [showModal, setShowModal] = useState(false);


  const [formData, setFormData] = useState({
    pacienteId: '',
    profissionalId: '',
    data: '',
    hora: '09:00',
    status: 'Agendado',
    obs: ''
  });

  const calendarsEvents = {
    Danger: "danger",
    Success: "success",
    Primary: "primary",
    Warning: "warning",
  };




  useEffect(() => {
    carregarConsultas();
  }, []);

  const carregarConsultas = async () => {
    try {
      const res = await api.get('/consultas/vwcompleta');
      const eventosConvertidos = res.data.map((c) => ({
        id: c.id.toString(),
        title: `${c.nome_paciente} - ${c.nome_profissional}`,
        start: new Date(c.data_agendamento),
        end: new Date(new Date(c.data_agendamento).getTime() + 30 * 60000),
        allDay: false,
        backgroundColor: c.situacao === 'Cancelado' ? '#dc3545' :
          c.situacao === 'Concluído' ? '#198754' :
            c.situacao === 'Confirmado' ? '#ffc107' : '#0d6efd'
      }));
      setEvents(eventosConvertidos);
      setConsultasOriginais(res.data);
      setEvents(filtrarConsultas(res.data, filtroPaciente, filtroProfissional));
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
    }
  };

  const filtrarConsultas = (lista: Consulta[], pacienteFiltro: string, profissionalFiltro: string) => {
    return lista
      .filter((c) =>
        (!pacienteFiltro || c.nome_paciente.toLowerCase().includes(pacienteFiltro.toLowerCase())) &&
        (!profissionalFiltro || c.nome_profissional.toLowerCase().includes(profissionalFiltro.toLowerCase()))
      )
      .map((c) => ({
        id: c.id.toString(),
        title: `${c.nome_paciente} - ${c.nome_profissional}`,
        start: new Date(c.data_agendamento),
        end: new Date(new Date(c.data_agendamento).getTime() + 30 * 60000),
        allDay: false,
        backgroundColor:
          c.situacao === 'Cancelado' ? '#dc3545' :
            c.situacao === 'Concluído' ? '#198754' :
              c.situacao === 'Confirmado' ? '#ffc107' : '#0d6efd',
        extendedProps: {
          calendar:
            c.situacao === 'Cancelado' ? 'Danger' :
              c.situacao === 'Concluído' ? 'Success' :
                c.situacao === 'Confirmado' ? 'Warning' : 'Primary'
        }
      }));
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setFormData({
      data: event.startStr,
      hora: '09:00',
      pacienteId: '',
      profissionalId: '',
      status: 'Agendado',
      obs: ''
    });
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    setEventEndDate(event.end?.toISOString().split("T")[0] || "");
    setEventLevel(event.extendedProps.calendar);
    openModal();
  };

  const handleAddOrUpdateEvent = () => {
    if (selectedEvent) {
      // Update existing event
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
              ...event,
              title: eventTitle,
              start: eventStartDate,
              end: eventEndDate,
              extendedProps: { calendar: eventLevel },
            }
            : event
        )
      );
    } else {
      // Add new event
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventTitle,
        start: eventStartDate,
        end: eventEndDate,
        allDay: true,
        extendedProps: { calendar: eventLevel },
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    }
    closeModal();
    resetModalFields();
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setSelectedEvent(null);
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
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar consulta:', error);
      alert('Erro ao salvar consulta');
    }
  };

  return (
    <>
      <PageMeta
        title="OdontoSys | Dashboard de Clínica Odontológica em React.js"
        description="Esta é a página do Dashboard da Clínica Odontológica OdontoSys, desenvolvido com React.js e Tailwind CSS"
      />
      <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Filtrar por paciente"
            value={filtroPaciente}
            onChange={(e) => {
              const valor = e.target.value;
              setFiltroPaciente(valor);
              setEvents(filtrarConsultas(consultasOriginais, valor, filtroProfissional));
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
              setEvents(filtrarConsultas(consultasOriginais, filtroPaciente, valor));
            }}
            className="w-full md:w-1/3 p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="custom-calendar">
          <FullCalendar
            locale={esLocale}
            ref={calendarRef}
            firstDay={7}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "Add Event +",
                click: openModal,
              },
            }}
          />
        </div>
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] p-6 lg:p-10">
          {/* <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
              <h2 className="text-xl font-semibold mb-4">Nova Consulta</h2>

              <div className="">
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
                  placeholder="Data da consulta"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <input
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Horário da consulta"
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
                <button onClick={() => closeModal()} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"                >
                  Cancelar
                </button>
                <button onClick={handleSaveConsulta} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                  Salvar
                </button>
              </div>
            </div>
          </div> */}

          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Edit Event" : "Add Event"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Plan your next big moment: schedule or edit an event to stay on
                track
              </p>
            </div>
            <div className="mt-8">
              <div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Event Title
                  </label>
                  <input
                    id="event-title"
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                <input
                  type="text"
                  placeholder="Profissional ID"
                  value={formData.profissionalId}
                  onChange={(e) => setFormData({ ...formData, profissionalId: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />                  
                </div>
              </div>
              <div className="mt-6">
                <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Color
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {Object.entries(calendarsEvents).map(([key, value]) => (
                    <div key={key} className="n-chk">
                      <div
                        className={`form-check form-check-${value} form-check-inline`}
                      >
                        <label
                          className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                          htmlFor={`modal${key}`}
                        >
                          <span className="relative">
                            <input
                              className="sr-only form-check-input"
                              type="radio"
                              name="event-level"
                              value={key}
                              id={`modal${key}`}
                              checked={eventLevel === key}
                              onChange={() => setEventLevel(key)}
                            />
                            <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                              <span
                                className={`h-2 w-2 rounded-full bg-white ${eventLevel === key ? "block" : "hidden"
                                  }`}
                              ></span>
                            </span>
                          </span>
                          {key}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter Start Date
                </label>
                <div className="relative">
                  <input
                    id="event-start-date"
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter End Date
                </label>
                <div className="relative">
                  <input
                    id="event-end-date"
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Close
              </button>
              <button
                onClick={handleAddOrUpdateEvent}
                type="button"
                className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {selectedEvent ? "Update Changes" : "Add Event"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: any) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
  return (
    <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;
