/* ==== src/components/Dashboard/Calendar/Calendar.jsx (v3 - Scelta Tipo Inserimento) ==== */
import React, { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Modal, Button, Form, Spinner, Alert, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import api from "../../../services/api";
import LoadingSpinner from "../../LoadingSpinner/LoadingSpinner";

import "./Calendar.css";

const initialNoteState = {
  id: "",
  title: "",
  content: "",
  date: "",
  expense_amount: "",
  location: "",
  item_count: "",
  // NUOVO: tipo di inserimento, per differenziare UI modale
  entryType: "note", // Default 'note', cambierà in 'expense'
};

const CalendarComponent = () => {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);

  // Stati Modali Principali
  const [showCreateEditModal, setShowCreateEditModal] = useState(false); // Unica modale per creare/editare
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // NUOVO: Stato per la modale di scelta tipo
  const [showChooseTypeModal, setShowChooseTypeModal] = useState(false);
  const [selectedDateForNewEntry, setSelectedDateForNewEntry] = useState(null);

  // Stato nota/spesa corrente e per eliminazione
  const [currentEntry, setCurrentEntry] = useState(initialNoteState);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [formError, setFormError] = useState("");

  // --- FUNZIONI ---

  const formatDate = (dateString) => {
    try {
      if (!dateString) return new Date().toISOString().split("T")[0];
      const date = new Date(dateString);
      const offset = date.getTimezoneOffset();
      const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
      return adjustedDate.toISOString().split("T")[0];
    } catch (e) {
      return new Date().toISOString().split("T")[0];
    }
  };

  // Fetch Note/Spese Iniziali
  const fetchNotes = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const response = await api.get("/auth/notes");
      const entries = response.data.notes || [];
      const formattedEvents = entries.map((entry) => ({
        id: entry.id.toString(),
        title: entry.title,
        start: formatDate(entry.date),
        allDay: true,
        extendedProps: {
          // Manteniamo tutti i dati qui
          content: entry.content,
          expense_amount: entry.expense_amount,
          location: entry.location,
          item_count: entry.item_count,
          // Determiniamo il tipo per il rendering/click
          entryType:
            entry.expense_amount != null ||
            entry.location ||
            entry.item_count != null
              ? "expense"
              : "note",
        },
        // Assegna classi diverse per stile
        className: `calendar-event-${entry.expense_amount != null || entry.location || entry.item_count != null ? "expense" : "note"}`,
        // Potresti aggiungere colori qui se vuoi
        // backgroundColor: entry.expense_amount != null ? 'var(--color-warning)' : 'var(--color-info)',
        // borderColor: entry.expense_amount != null ? 'var(--color-warning-hover)' : 'var(--color-info-hover)',
      }));
      setEvents(formattedEvents);
    } catch (error) {
      /* ... gestione errore ... */
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // --- Handlers Apertura Modali ---

  // 1. Click su una data -> Apre modale di SCELTA
  const handleDateClick = (arg) => {
    setSelectedDateForNewEntry(formatDate(arg.dateStr)); // Salva la data cliccata
    setShowChooseTypeModal(true); // Mostra la modale di scelta
  };

  // 2. Scelta del tipo dalla modale -> Apre modale creazione/modifica
  const handleChooseEntryType = (type) => {
    setShowChooseTypeModal(false); // Chiude la modale di scelta
    setFormError("");
    setCurrentEntry({
      ...initialNoteState,
      date: selectedDateForNewEntry || new Date().toISOString().split("T")[0], // Usa data salvata o oggi
      entryType: type, // Imposta il tipo scelto
    });
    setShowCreateEditModal(true); // Apre la modale principale
  };

  // 3. Click su un evento esistente -> Apre modale visualizzazione
  const handleEventClick = (clickInfo) => {
    const { id, title, extendedProps, startStr } = clickInfo.event;
    setCurrentEntry({
      id,
      title,
      content: extendedProps.content || "",
      date: formatDate(startStr),
      expense_amount: extendedProps.expense_amount ?? "",
      location: extendedProps.location ?? "",
      item_count: extendedProps.item_count ?? "",
      // Determina il tipo per coerenza (anche se non strettamente necessario qui)
      entryType:
        extendedProps.entryType ||
        (extendedProps.expense_amount != null ? "expense" : "note"),
    });
    setShowViewModal(true);
  };

  // --- Handlers Chiusura Modali ---
  const handleCloseChooseTypeModal = () => setShowChooseTypeModal(false);
  const handleCloseCreateEditModal = () => {
    setShowCreateEditModal(false);
    setCurrentEntry(initialNoteState);
    setFormError("");
  };
  const handleCloseViewModal = () => setShowViewModal(false);
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setNoteToDelete(null);
  };

  // Gestione Input Modali (invariato)
  const handleInputChange = (e) => {
    /* ... (come prima) ... */
    const { name, value, type } = e.target;
    setCurrentEntry((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
    if (formError) setFormError("");
  };

  // --- Funzioni CRUD Note/Spese ---

  // Validazione (invariata, controlla solo titolo e data obbligatori)
  const validateEntryForm = () => {
    /* ... (come prima) ... */
    if (!currentEntry.title.trim()) {
      setFormError("Il titolo/descrizione breve è obbligatorio.");
      return false;
    }
    if (!currentEntry.date) {
      setFormError("La data è obbligatoria.");
      return false;
    }
    if (
      currentEntry.expense_amount &&
      isNaN(parseFloat(currentEntry.expense_amount))
    ) {
      setFormError("L'importo spesa deve essere un numero valido.");
      return false;
    }
    if (
      currentEntry.item_count &&
      (!Number.isInteger(Number(currentEntry.item_count)) ||
        Number(currentEntry.item_count) < 0)
    ) {
      setFormError("Il numero prodotti deve essere un intero non negativo.");
      return false;
    }
    setFormError("");
    return true;
  };

  // Salva (Crea o Aggiorna) - Logica unificata
  const handleSaveEntry = async () => {
    if (!validateEntryForm()) return;
    setOperationLoading(true);

    const {
      id,
      title,
      content,
      date,
      expense_amount,
      location,
      item_count,
      entryType,
    } = currentEntry;
    const isEditing = !!id;

    // Prepara payload per API (converte vuoti/NaN in null)
    const payload = {
      title: title.trim(),
      content: content || null,
      date,
      // Invia i campi spesa solo se il tipo è 'expense' (o se sono valorizzati,
      // il backend li gestirà comunque come NULL se non inviati)
      expense_amount: expense_amount === "" ? null : parseFloat(expense_amount),
      location: location.trim() === "" ? null : location.trim(),
      item_count: item_count === "" ? null : parseInt(item_count, 10),
    };

    try {
      let savedEntry;
      if (isEditing) {
        // --- Aggiornamento ---
        console.log(`[noteCtrl] Aggiornamento ${entryType} ID: ${id}`);
        await api.put(`/auth/notes/${id}`, payload);
        // Ricostruiamo l'oggetto aggiornato per l'UI
        savedEntry = { ...currentEntry, ...payload }; // Sovrascrive con valori processati
      } else {
        // --- Creazione ---
        console.log(`[noteCtrl] Creazione nuova ${entryType}`);
        const response = await api.post("/auth/notes", payload);
        savedEntry = response.data.note; // API restituisce la nota creata
      }

      // Aggiornamento UI ottimistico (con TUTTI i dati)
      const newOrUpdatedEvent = {
        id: savedEntry.id.toString(),
        title: savedEntry.title,
        start: formatDate(savedEntry.date),
        allDay: true,
        extendedProps: {
          content: savedEntry.content,
          expense_amount: savedEntry.expense_amount,
          location: savedEntry.location,
          item_count: savedEntry.item_count,
          entryType:
            savedEntry.expense_amount != null ||
            savedEntry.location ||
            savedEntry.item_count != null
              ? "expense"
              : "note", // Ricalcola tipo
        },
        className: `calendar-event-${savedEntry.expense_amount != null || savedEntry.location || savedEntry.item_count != null ? "expense" : "note"}`,
      };

      setEvents((prev) => {
        const existingIndex = prev.findIndex(
          (event) => event.id === newOrUpdatedEvent.id
        );
        if (existingIndex > -1) {
          // Aggiorna evento esistente
          const updatedEvents = [...prev];
          updatedEvents[existingIndex] = newOrUpdatedEvent;
          return updatedEvents;
        } else {
          // Aggiungi nuovo evento
          return [...prev, newOrUpdatedEvent];
        }
      });

      handleCloseCreateEditModal(); // Chiudi e resetta la modale
      toast.success(
        `${entryType === "expense" ? "Spesa" : "Nota"} ${isEditing ? "aggiornata" : "creata"}!`
      );
    } catch (error) {
      console.error(
        `Errore ${isEditing ? "aggiornamento" : "creazione"} ${entryType}:`,
        error
      );
      const apiError =
        error.response?.data?.error ||
        error.response?.data?.message ||
        `Errore durante ${isEditing ? "l'aggiornamento" : "la creazione"}.`;
      setFormError(apiError);
    } finally {
      setOperationLoading(false);
    }
  };

  // ELIMINA Nota (invariato)
  const handleConfirmDelete = async () => {
    /* ... (come prima) ... */
    if (!noteToDelete) return;
    const noteIdToDelete = noteToDelete.id;
    const noteTitleToDelete = noteToDelete.title;
    handleCloseDeleteModal();
    setOperationLoading(true);
    try {
      await api.delete(`/auth/notes/${noteIdToDelete}`);
      setEvents((prev) =>
        prev.filter((event) => event.id !== noteIdToDelete.toString())
      );
      toast.success(`Nota "${noteTitleToDelete}" eliminata.`);
      if (currentEntry.id === noteIdToDelete) {
        setShowViewModal(false);
        setShowCreateEditModal(false); // Chiudi anche modale edit se aperta
        setCurrentEntry(initialNoteState);
      }
    } catch (error) {
      /* ... gestione errore ... */
    } finally {
      setOperationLoading(false);
    }
  };

  // --- Navigazione tra Modali ---
  const handleEditFromView = () => {
    setShowViewModal(false);
    setFormError("");
    setShowCreateEditModal(true); // Apre la modale unica di edit/create
  };
  const handleDeleteRequest = (note) => {
    setNoteToDelete(note);
    setShowDeleteModal(true);
  };
  const handleDeleteFromView = () => {
    handleDeleteRequest(currentEntry);
    setShowViewModal(false);
  };
  const handleDeleteFromEdit = () => {
    handleDeleteRequest(currentEntry);
    setShowCreateEditModal(false);
  }; // Ora chiude la modale unica

  // --- Rendering ---
  return (
    <div className="calendar-wrapper">
      {/* ... (Overlay Loading) ... */}
      {loadingEvents && (
        <div className="calendar-loading-overlay">
          <LoadingSpinner />
          <p className="font-secondary">Caricamento calendario...</p>
        </div>
      )}

      <div
        className={`calendar-container ${!loadingEvents ? "calendar-ready" : ""}`}
      >
        {/* ... (FullCalendar setup invariato) ... */}
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek",
          }}
          buttonText={{ today: "Oggi", month: "Mese", week: "Settimana" }}
          events={events}
          dateClick={handleDateClick} // Apre Modale Scelta Tipo
          eventClick={handleEventClick} // Apre Modale Visualizzazione
          locale="it"
          firstDay={1}
          height="auto"
          contentHeight="auto"
          timeZone="local"
          eventDisplay="block"
        />
      </div>

      {/* --- MODALI --- */}

      {/* NUOVA: Modale Scelta Tipo Inserimento */}
      <Modal
        show={showChooseTypeModal}
        onHide={handleCloseChooseTypeModal}
        centered
        size="sm"
        className="calendar-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title className="font-primary">
            Cosa vuoi aggiungere?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-2">
          <Button
            variant="info"
            onClick={() => handleChooseEntryType("note")}
            className="font-secondary"
          >
            📝 Nota Semplice
          </Button>
          <Button
            variant="warning"
            onClick={() => handleChooseEntryType("expense")}
            className="font-secondary"
          >
            🛒 Registra Spesa
          </Button>
        </Modal.Body>
      </Modal>

      {/* Modale Unificata Creazione/Modifica */}
      <Modal
        show={showCreateEditModal}
        onHide={handleCloseCreateEditModal}
        centered
        className="calendar-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title className="font-primary">
            {currentEntry.id
              ? `Modifica ${currentEntry.entryType === "expense" ? "Spesa" : "Nota"}`
              : `Nuova ${currentEntry.entryType === "expense" ? "Spesa" : "Nota"}`}
          </Modal.Title>
        </Modal.Header>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveEntry();
          }}
        >
          <Modal.Body>
            {formError && (
              <Alert variant="danger" className="text-center font-secondary">
                {formError}
              </Alert>
            )}
            {/* Campi Base */}
            <Form.Group controlId="entryDate" className="mb-3">
              <Form.Label className="font-secondary">
                Data <span className="required-field">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={currentEntry.date}
                onChange={handleInputChange}
                required
                className="font-secondary"
              />
            </Form.Group>
            <Form.Group controlId="entryTitle" className="mb-3">
              <Form.Label className="font-secondary">
                Titolo/Descrizione Breve{" "}
                <span className="required-field">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={currentEntry.title}
                onChange={handleInputChange}
                placeholder={
                  currentEntry.entryType === "expense"
                    ? "Es. Spesa Esselunga"
                    : "Titolo nota"
                }
                required
                autoFocus={!currentEntry.id}
                className="font-secondary"
              />
            </Form.Group>
            <Form.Group controlId="entryContent" className="mb-3">
              <Form.Label className="font-secondary">
                Note Aggiuntive
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="content"
                value={currentEntry.content}
                onChange={handleInputChange}
                placeholder="(Opzionale)"
                className="font-secondary"
              />
            </Form.Group>

            {/* Campi Spesa (Mostra solo se entryType è 'expense') */}
            {currentEntry.entryType === "expense" && (
              <>
                <hr />
                <p className="text-muted font-secondary mb-2">
                  <small>Dettagli Spesa (Opzionali)</small>
                </p>
                <Row>
                  <Col md={6}>
                    <Form.Group controlId="entryExpenseAmount" className="mb-3">
                      <Form.Label className="font-secondary">
                        Importo Spesa (€)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="expense_amount"
                        value={currentEntry.expense_amount}
                        onChange={handleInputChange}
                        placeholder="Es. 55.50"
                        step="0.01"
                        min="0"
                        className="font-secondary"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="entryItemCount" className="mb-3">
                      <Form.Label className="font-secondary">
                        Num. Prodotti
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="item_count"
                        value={currentEntry.item_count}
                        onChange={handleInputChange}
                        placeholder="Es. 15"
                        step="1"
                        min="0"
                        className="font-secondary"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group controlId="entryLocation" className="mb-3">
                  <Form.Label className="font-secondary">
                    Luogo/Negozio
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={currentEntry.location}
                    onChange={handleInputChange}
                    placeholder="Es. Supermercato XYZ, Online"
                    className="font-secondary"
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="justify-content-between">
            {/* Bottone elimina solo in modalità modifica */}
            {currentEntry.id ? (
              <Button
                variant="danger"
                onClick={handleDeleteFromEdit}
                disabled={operationLoading}
                className="font-secondary"
              >
                Elimina
              </Button>
            ) : (
              <div></div> /* Placeholder per mantenere allineamento */
            )}
            <div>
              <Button
                variant="secondary"
                onClick={handleCloseCreateEditModal}
                disabled={operationLoading}
                className="me-2 font-secondary"
              >
                Annulla
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={operationLoading}
                className="font-secondary"
              >
                {operationLoading ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : currentEntry.id ? (
                  "Salva"
                ) : (
                  "Crea"
                )}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Visualizzazione Nota/Spesa (mostra dettagli spesa condizionatamente) */}
      <Modal
        show={showViewModal}
        onHide={handleCloseViewModal}
        centered
        className="calendar-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title className="font-primary">
            {currentEntry.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(currentEntry.expense_amount ||
            currentEntry.location ||
            currentEntry.item_count) && (
            <div className="mb-3 border-bottom pb-3">
              <p className="mb-1 font-secondary">
                <strong className="font-secondary">Dettagli Spesa:</strong>
              </p>
              {currentEntry.expense_amount && (
                <p className="mb-1 font-secondary ms-2">
                  <strong>Importo:</strong> €{" "}
                  {parseFloat(currentEntry.expense_amount).toFixed(2)}
                </p>
              )}
              {currentEntry.location && (
                <p className="mb-1 font-secondary ms-2">
                  <strong>Luogo:</strong> {currentEntry.location}
                </p>
              )}
              {currentEntry.item_count && (
                <p className="mb-0 font-secondary ms-2">
                  <strong>Prodotti:</strong> {currentEntry.item_count}
                </p>
              )}
            </div>
          )}
          {currentEntry.content ? (
            <>
              {(currentEntry.expense_amount ||
                currentEntry.location ||
                currentEntry.item_count) && (
                <p className="mb-1 font-secondary">
                  <strong className="font-secondary">Note:</strong>
                </p>
              )}
              <p
                className={`font-secondary ${currentEntry.expense_amount || currentEntry.location || currentEntry.item_count ? "ms-2" : ""}`}
              >
                {currentEntry.content}
              </p>
            </>
          ) : (
            !(
              currentEntry.expense_amount ||
              currentEntry.location ||
              currentEntry.item_count
            ) && (
              <p className="text-muted font-secondary">
                Nessuna descrizione aggiuntiva.
              </p>
            )
          )}
          <p className="mb-0 mt-3">
            <small className="font-secondary">
              <strong>Data:</strong> {currentEntry.date}
            </small>
          </p>
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <Button
            variant="danger"
            onClick={handleDeleteFromView}
            disabled={operationLoading}
            className="font-secondary"
          >
            Elimina
          </Button>
          <div>
            <Button
              variant="secondary"
              onClick={handleCloseViewModal}
              disabled={operationLoading}
              className="me-2 font-secondary"
            >
              Chiudi
            </Button>
            <Button
              variant="primary"
              onClick={handleEditFromView}
              disabled={operationLoading}
              className="font-secondary"
            >
              Modifica
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Modal Conferma Eliminazione (invariato) */}
      <Modal
        show={showDeleteModal}
        onHide={handleCloseDeleteModal}
        centered
        size="sm"
        className="calendar-modal"
      >
        {/* ... (contenuto invariato) ... */}
        <Modal.Header closeButton>
          <Modal.Title className="font-primary">Conferma</Modal.Title>
        </Modal.Header>
        <Modal.Body className="font-secondary text-center">
          Eliminare la nota:
          <br />
          <strong className="font-secondary d-block mt-1">
            "{noteToDelete?.title}"
          </strong>
          ?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseDeleteModal}
            disabled={operationLoading}
            className="font-secondary"
          >
            No
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={operationLoading}
            className="font-secondary"
          >
            {operationLoading ? (
              <Spinner as="span" animation="border" size="sm" />
            ) : (
              "Sì, Elimina"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CalendarComponent;
