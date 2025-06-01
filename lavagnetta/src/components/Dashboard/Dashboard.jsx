/* ==== src/components/Dashboard/Dashboard.jsx (v2 - CON Bottone Statistiche) ==== */
import React from "react";
import Calendar from "./Calendar/Calendar"; // Importa componente Calendario
import Preview from "./Preview/Preview"; // Importa componente Anteprime
import { Link } from "react-router-dom"; // Importa Link per il pulsante
import { Button } from "react-bootstrap"; // Importa Button
import { FaChartLine } from "react-icons/fa"; // Importa icona statistiche
import "react-toastify/dist/ReactToastify.css";
import "./Dashboard.css"; // Importa CSS specifico per Dashboard layout

const Dashboard = () => {
  return (
    // Contenitore principale della Dashboard
    <div className="dashboard-container">
      {/* ---- Header della PAGINA Dashboard con Titolo e Bottone Statistiche ---- */}
      <div className="dashboard-page-header d-flex justify-content-between align-items-center mb-4">
        <h1 className="font-primary text-shadow-chalk mb-0">Dashboard</h1>
        <Link to="/statistics">
          {" "}
          {/* Link che porta alla pagina /statistics */}
          <Button variant="outline-info" size="sm" className="font-secondary">
            {" "}
            {/* Bottone Bootstrap */}
            <FaChartLine className="me-1" /> {/* Icona */}
            Vai alle Statistiche
          </Button>
        </Link>
      </div>
      {/* ------------------------------------------------------------------------ */}

      {/* Sezione Calendario */}
      <div className="dashboard-section calendar-section">
        {/* Potresti voler aggiungere un titolo tipo <h2>Calendario</h2> qui */}
        <Calendar />
      </div>

      {/* Sezione Anteprime Lavagne */}
      <div className="dashboard-section preview-section">
        {/* Potresti voler aggiungere un titolo tipo <h2>Anteprime</h2> qui */}
        <Preview />
      </div>
    </div>
  );
};

export default Dashboard;
