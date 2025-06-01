/* ==== src/components/GroupDashboard/Modals/InviteMembersModal.jsx (PRONTO) ==== */
import React, { useState } from "react";
import { Modal, Button, Form, Spinner, Alert } from "react-bootstrap";
import { toast } from "react-toastify"; // Usato per successo
import api from "../../../services/api";
// Rimuoviamo import CSS specifico se non necessario (stili globali/bootstrap dovrebbero bastare)
// import "./InviteMembersModal.css";

const availableRolesForInvite = [
  { value: "level1", label: "Editor" },
  { value: "level2", label: "Contributor" },
];

const InviteMembersModal = ({ show, handleClose, groupId }) => {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState("level2"); // Default a Contributor
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (e) => {
    setEmails(e.target.value);
    if (submitError) setSubmitError("");
    if (validated) setValidated(false);
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setSubmitError("");
    setValidated(true);

    const emailList = emails
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    let currentError = "";

    if (emailList.length === 0) {
      currentError = "Inserisci almeno un indirizzo email valido.";
    } else {
      const invalidEmails = emailList.filter((email) => !isValidEmail(email));
      if (invalidEmails.length > 0) {
        currentError = `Indirizzi email non validi: ${invalidEmails.join(", ")}`;
      }
    }

    if (currentError) {
      setSubmitError(currentError);
      return; // Non procedere con l'API se errore frontend
    }

    const membersToInvite = emailList.map((email) => ({ email, role }));
    setLoading(true);

    try {
      await api.post(`/auth/groups/${groupId}/invite`, {
        members: membersToInvite,
      });
      toast.success(
        `Invito${emailList.length > 1 ? "i" : ""} inviat${emailList.length > 1 ? "i" : "o"}!`
      );
      closeModalAndReset();
    } catch (err) {
      const apiError =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Errore invio inviti.";
      setSubmitError(apiError);
    } finally {
      setLoading(false);
    }
  };

  const closeModalAndReset = () => {
    handleClose();
    // Resetta stati interni dopo la chiusura (usando onExited)
  };

  // Pulisce stato e errore quando la modale viene chiusa
  const handleExited = () => {
    setEmails("");
    setRole("level2");
    setSubmitError("");
    setValidated(false);
    setLoading(false);
  };

  return (
    <Modal
      show={show}
      onHide={closeModalAndReset} // Chiama reset alla chiusura standard
      onExited={handleExited} // Pulisce dopo animazione chiusura
      centered
      className="invite-members-modal" // Classe per eventuali stili specifici
    >
      <Modal.Header closeButton>
        {/* Titolo Caveat Ocra */}
        <Modal.Title className="font-primary text-accent">
          Invita Nuovi Membri
        </Modal.Title>
      </Modal.Header>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Alert Errori (Usa stile globale danger) */}
          {submitError && (
            <Alert variant="danger" className="text-center font-secondary mb-3">
              {submitError}
            </Alert>
          )}

          {/* Campo Email */}
          <Form.Group className="mb-3" controlId="inviteEmails">
            <Form.Label className="font-secondary">Indirizzi Email</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              className="font-secondary" // Font Lato per textarea
              placeholder="mario.rossi@email.com, luigi.verdi@email.com, ..."
              value={emails}
              onChange={handleInputChange}
              required
              isInvalid={validated && (!!submitError || !emails.trim())} // Mostra invalido se errore O vuoto dopo tentativo submit
              aria-describedby="emailHelpBlock"
            />
            <Form.Text id="emailHelpBlock" muted className="font-secondary">
              Separa più indirizzi con virgola, punto e virgola o a capo.
            </Form.Text>
            <Form.Control.Feedback type="invalid">
              Inserisci almeno un indirizzo email valido.
            </Form.Control.Feedback>
          </Form.Group>

          {/* Campo Ruolo */}
          <Form.Group className="mb-3" controlId="inviteRole">
            <Form.Label className="font-secondary">
              Assegna Ruolo Iniziale
            </Form.Label>
            <Form.Select
              value={role}
              onChange={handleRoleChange}
              className="font-secondary"
            >
              {" "}
              {/* Font Lato per Select */}
              {availableRolesForInvite.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          {/* Bottoni con Font Lato */}
          <Button
            variant="secondary"
            onClick={closeModalAndReset}
            disabled={loading}
            className="font-secondary"
          >
            Annulla
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            className="font-secondary"
          >
            {loading ? (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                className="me-1"
              />
            ) : null}
            Invia Inviti
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default InviteMembersModal;
