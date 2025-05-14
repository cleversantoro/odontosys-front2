import React, { ReactElement } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/Errors/NotFound";
import UserProfiles from "./pages/Usuarios/UserProfiles";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

import Home from "./pages/Home/Home";
import DashBoardConsultas from "./pages/Dashboard/DashboardConsultas";
import DashBoardDespesas from "./pages/Dashboard/DashboardDespesas";
import Agendamentos from "./pages/Agendamento/Agendamentos";
import ConsultasLista from "./pages/Consultas/ConsultasLista";
import PacientesLista from "./pages/Pacientes/PacientesLista";
import ProfissionaisPage from "./pages/Profissionais/ProfissionaisPage";
import Orcamento from "./pages/Orcamento/Orcamento";
import Financeiro from "./pages/Financeiro/Financeiro";
import Calendar from "./pages/Agendamento/Calendar";
import { useAuth } from "./context/AuthContext";
import Config from "./pages/Config/Config";



const PrivateRoute = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" />;
};

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="/Home" element={<Home />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            {/* <Route path="/blank" element={<Blank />} /> */}

            {/* System */}
            <Route path="/Agendamentos" element={<Agendamentos />} />
            <Route path="/DashBoardConsultas" element={<DashBoardConsultas />} />
            <Route path="/DashBoardDespesas" element={<DashBoardDespesas />} />

            <Route path="/Consultas" element={<ConsultasLista />} />
            <Route path="/Pacientes" element={<PacientesLista />} />
            <Route path="/Profissionais" element={<ProfissionaisPage />} />
            <Route path="/Orcamentos" element={<Orcamento />} />
            <Route path="/Usuarios" element={<UserProfiles />} />
            <Route path="/Financeiro" element={<Financeiro />} />
            <Route path="/Config" element={<Config />} />

            {/* Forms */}
            {/* <Route path="/form-elements" element={<FormElements />} /> */}

            {/* Tables */}
            {/* <Route path="/basic-tables" element={<BasicTables />} /> */}

            {/* Ui Elements */}
            {/* <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} /> */}

            {/* Charts */}
            {/* <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} /> */}
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Authentication */}
          <Route index path="/" element={<SignIn />} />
          <Route path="/register" element={<SignUp />} />


          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
