// src/components/Statistics/StatisticsPage.jsx
// Assicurati che il CSS sia importato correttamente
import "./StatisticsPage.css";
import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import api from "../../services/api"; // Verifica percorso
// Rimosso toast non usato
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2"; // Importa i tipi di grafico

// Registra i componenti Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StatisticsPage = () => {
  // --- STATI ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [availableLocations, setAvailableLocations] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [timeChartType, setTimeChartType] = useState("line"); // Default 'line'
  const [locationChartType, setLocationChartType] = useState("pie"); // Default 'pie'

  // --- FUNZIONI FETCH ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Non resettare summaryData qui per mantenerlo visibile durante il fetch
    // setSummaryData(null);
    // setTimeSeriesData([]);
    // setLocationData([]);

    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (location) params.location = location;
    params.groupBy = "month"; // Per ora solo per mese

    console.log("[StatsPage] Fetching data with params:", params);

    try {
      // Esegui le chiamate in parallelo
      const [summaryRes, timeSeriesRes, locationRes] = await Promise.allSettled(
        [
          api.get("/stats/summary", { params }),
          api.get("/stats/timeseries", { params }),
          // Per byLocation, non passare il filtro 'location' ma solo le date
          api.get("/stats/bylocation", {
            params: { startDate: params.startDate, endDate: params.endDate },
          }),
        ]
      );

      let fetchError = null;

      // Gestione Risultati
      if (summaryRes.status === "fulfilled") {
        setSummaryData(summaryRes.value.data);
      } else {
        console.error("Errore fetch summary:", summaryRes.reason);
        fetchError = "Errore caricamento riepilogo.";
      }

      if (timeSeriesRes.status === "fulfilled") {
        setTimeSeriesData(timeSeriesRes.value.data || []);
      } else {
        console.error("Errore fetch timeseries:", timeSeriesRes.reason);
        fetchError =
          (fetchError ? `${fetchError} ` : "") + "Errore dati temporali.";
      }

      if (locationRes.status === "fulfilled") {
        const locData = locationRes.value.data || [];
        setLocationData(locData);
        // Estrai le location UNICHE dai dati appena caricati (solo se locationRes è ok)
        const uniqueLocations = [
          ...new Set(locData.map((item) => item.location)),
        ];
        // SOLO aggiorna se l'elenco delle locations è cambiato (per evitare re-render inutili del select)
        setAvailableLocations((prevLocs) => {
          const sortedNewLocs = uniqueLocations.sort();
          if (JSON.stringify(prevLocs) !== JSON.stringify(sortedNewLocs)) {
            return sortedNewLocs;
          }
          return prevLocs;
        });
      } else {
        console.error("Errore fetch byLocation:", locationRes.reason);
        fetchError =
          (fetchError ? `${fetchError} ` : "") + "Errore dati per luogo.";
      }

      if (fetchError) setError(fetchError); // Imposta l'errore aggregato se ce n'è stato uno
    } catch (generalError) {
      console.error("Errore generale fetch statistiche:", generalError);
      setError(
        "Impossibile caricare le statistiche. Controlla la connessione."
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, location]); // Dipende dai filtri

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HANDLERS ---
  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
  };
  // Rimosso handleApplyFilters non usato

  // --- OPZIONI E DATI PER GRAFICI ---

  // Opzioni comuni per i grafici (colori, leggibilità)
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Permette al grafico di adattarsi al contenitore
    plugins: {
      legend: {
        position: "top", // Posizione legenda
        labels: { color: "var(--color-text-light-gray)" }, // Colore testo legenda
      },
      title: {
        display: true, // Mostra titolo (lo impostiamo per grafico)
        color: "var(--color-text-chalk)", // Colore titolo
        font: { size: 16, family: "var(--font-primary)" }, // Font titolo
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)", // Sfondo tooltip
        titleFont: { family: "var(--font-secondary)" },
        bodyFont: { family: "var(--font-secondary)" },
      },
    },
    scales: {
      // Opzioni per assi (usate da Line/Bar)
      x: {
        ticks: { color: "var(--color-text-light-gray)" }, // Colore etichette asse X
        grid: { color: "rgba(255, 255, 255, 0.1)" }, // Colore griglia X
      },
      y: {
        ticks: {
          color: "var(--color-text-light-gray)",
          callback: (value) => `€ ${value}`,
        }, // Colore etichette Y + Euro
        grid: { color: "rgba(255, 255, 255, 0.1)" }, // Colore griglia Y
      },
    },
  };

  // Dati e Opzioni Grafico Temporale
  const timeSeriesChartData = {
    labels: timeSeriesData.map((d) => d.timePeriod), // Es. '2024-04'
    datasets: [
      {
        label: "Spesa Mensile", // Titolo dataset
        data: timeSeriesData.map((d) => d.totalAmount),
        borderColor: "var(--color-accent-primary)", // Colore linea/bordo barre (Ocra)
        backgroundColor:
          timeChartType === "line"
            ? "rgba(255, 193, 7, 0.1)"
            : "rgba(255, 193, 7, 0.6)", // Riempimento linea / Colore barre
        fill: timeChartType === "line", // Riempimento solo per linea
        tension: 0.1, // Curvatura linea
      },
    ],
  };
  const timeSeriesChartOptions = {
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      title: {
        ...commonChartOptions.plugins.title,
        text: "Andamento Spesa nel Tempo",
      },
    },
    scales: {
      ...commonChartOptions.scales,
      y: { ...commonChartOptions.scales.y, beginAtZero: true }, // Assicura che asse Y parta da 0
    },
  };

  // Dati e Opzioni Grafico per Luogo
  const locationChartData = {
    labels: locationData.map((d) => d.location || "Sconosciuto"), // Etichette (nomi negozi)
    datasets: [
      {
        label: "Spesa per Negozio",
        data: locationData.map((d) => d.totalAmount),
        // Colori dinamici per Pie/Doughnut (o colori fissi per Bar)
        backgroundColor:
          locationChartType === "pie"
            ? [
                "rgba(255, 193, 7, 0.7)", // Ocra
                "rgba(70, 130, 180, 0.7)", // Blu Acciaio
                "rgba(107, 142, 35, 0.7)", // Verde Oliva
                "rgba(160, 82, 45, 0.7)", // Marrone/Danger
                "rgba(79, 84, 92, 0.7)", // Grigio Scuro/Secondary
                "#673AB7", // Viola
                "#00BCD4", // Ciano
                // Aggiungi altri colori se prevedi molti negozi
              ]
            : "rgba(70, 130, 180, 0.6)", // Blu Acciaio per barre
        borderColor:
          locationChartType === "pie"
            ? "var(--color-bg-dark)"
            : "var(--color-info-hover)", // Bordo fette / Bordo barre
        borderWidth: locationChartType === "pie" ? 2 : 1,
      },
    ],
  };
  const locationChartOptions = {
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      title: {
        ...commonChartOptions.plugins.title,
        text: "Distribuzione Spesa per Luogo",
      },
    },
    // Rimuovi scale per grafici a torta
    scales: locationChartType === "pie" ? undefined : commonChartOptions.scales,
  };

  // --- RENDERING ---
  return (
    <Container fluid className="statistics-page mt-3">
      <h1 className="font-primary text-center mb-4">Statistiche Spese</h1>

      {/* Filtri */}
      <Card className="mb-4">
        <Card.Header className="font-primary">Filtra Dati</Card.Header>{" "}
        {/* Usa font primario */}
        <Card.Body>
          <Form>
            <Row className="g-3 align-items-end">
              <Col md={3} xs={6}>
                <Form.Group controlId="startDate">
                  <Form.Label className="font-secondary">
                    Data Inizio
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={handleFilterChange(setStartDate)}
                    className="font-secondary"
                  />
                </Form.Group>
              </Col>
              <Col md={3} xs={6}>
                <Form.Group controlId="endDate">
                  <Form.Label className="font-secondary">Data Fine</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={handleFilterChange(setEndDate)}
                    min={startDate || undefined}
                    className="font-secondary"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="location">
                  <Form.Label className="font-secondary">
                    Luogo/Negozio
                  </Form.Label>
                  <Form.Select
                    value={location}
                    onChange={handleFilterChange(setLocation)}
                    className="font-secondary"
                  >
                    <option value="">Tutti i luoghi</option>
                    {availableLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Riepilogo */}
      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" /> Caricamento...
        </div>
      )}
      {error && (
        <Alert variant="danger" className="font-secondary">
          {error}
        </Alert>
      )}
      {!loading && !error && summaryData && (
        <Row className="mb-4 g-3">
          {/* ... Card Spesa Totale, Media, Costo Medio Prodotto (come prima) ... */}
          <Col md={4} sm={6} xs={12}>
            {" "}
            <Card bg="success" text="white" className="text-center h-100">
              {" "}
              <Card.Body>
                {" "}
                <Card.Title as="h5">Spesa Totale</Card.Title>{" "}
                <Card.Text className="fs-4 fw-bold">
                  € {summaryData.totalExpenseAmount}
                </Card.Text>{" "}
              </Card.Body>{" "}
            </Card>{" "}
          </Col>
          <Col md={4} sm={6} xs={12}>
            {" "}
            <Card bg="info" text="white" className="text-center h-100">
              {" "}
              <Card.Body>
                {" "}
                <Card.Title as="h5">Spesa Media</Card.Title>{" "}
                <Card.Text className="fs-4 fw-bold">
                  € {summaryData.averageExpenseAmount}
                </Card.Text>{" "}
                <small>({summaryData.totalExpenseEntries} spese)</small>{" "}
              </Card.Body>{" "}
            </Card>{" "}
          </Col>
          <Col md={4} sm={12} xs={12}>
            {" "}
            <Card bg="secondary" text="white" className="text-center h-100">
              {" "}
              <Card.Body>
                {" "}
                <Card.Title as="h5">Costo Medio Prodotto</Card.Title>{" "}
                <Card.Text className="fs-4 fw-bold">
                  € {summaryData.averageItemCost}
                </Card.Text>{" "}
                <small>({summaryData.totalItemCount} prodotti)</small>{" "}
              </Card.Body>{" "}
            </Card>{" "}
          </Col>
        </Row>
      )}

      {/* Grafici */}
      {!loading &&
        !error &&
        (timeSeriesData.length > 0 || locationData.length > 0) && (
          <Row>
            {/* Grafico Temporale */}
            <Col lg={8} className="mb-4">
              {" "}
              {/* Occupa più spazio */}
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>Andamento Spesa</span>
                  <Form.Group
                    controlId="timeChartTypeSelect"
                    className="mb-0"
                    style={{ maxWidth: "120px" }}
                  >
                    <Form.Select
                      size="sm"
                      value={timeChartType}
                      onChange={handleFilterChange(setTimeChartType)}
                      className="font-secondary"
                    >
                      <option value="line">Linea</option>
                      <option value="bar">Barre</option>
                    </Form.Select>
                  </Form.Group>
                </Card.Header>
                <Card.Body style={{ height: "350px" }}>
                  {" "}
                  {/* Altezza fissa per consistenza */}
                  {timeSeriesData.length > 0 ? (
                    timeChartType === "line" ? (
                      <Line
                        options={timeSeriesChartOptions}
                        data={timeSeriesChartData}
                      />
                    ) : (
                      <Bar
                        options={timeSeriesChartOptions}
                        data={timeSeriesChartData}
                      />
                    )
                  ) : (
                    <p className="text-muted text-center mt-5">
                      Nessun dato temporale per i filtri scelti.
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>
            {/* Grafico per Luogo */}
            <Col lg={4} className="mb-4">
              {" "}
              {/* Occupa meno spazio */}
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>Spesa per Luogo</span>
                  <Form.Group
                    controlId="locationChartTypeSelect"
                    className="mb-0"
                    style={{ maxWidth: "120px" }}
                  >
                    <Form.Select
                      size="sm"
                      value={locationChartType}
                      onChange={handleFilterChange(setLocationChartType)}
                      className="font-secondary"
                    >
                      <option value="pie">Torta</option>
                      <option value="bar">Barre</option>
                    </Form.Select>
                  </Form.Group>
                </Card.Header>
                <Card.Body
                  style={{
                    height: "350px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {locationData.length > 0 ? (
                    locationChartType === "pie" ? (
                      <Pie
                        options={locationChartOptions}
                        data={locationChartData}
                      />
                    ) : (
                      <Bar
                        options={locationChartOptions}
                        data={locationChartData}
                      />
                    )
                  ) : (
                    <p className="text-muted text-center">
                      Nessun dato per luogo disponibile.
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

      {/* Esportazione (invariato) */}
      {!loading && !error && (
        <Card className="mt-2">
          {" "}
          {/* Aggiunto margine sopra */}
          <Card.Header>Esporta Dati</Card.Header>
          <Card.Body className="d-flex justify-content-center gap-3">
            <Button variant="outline-success" disabled>
              Esporta CSV (WIP)
            </Button>
            <Button variant="outline-danger" disabled>
              Esporta PDF (WIP)
            </Button>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default StatisticsPage;
