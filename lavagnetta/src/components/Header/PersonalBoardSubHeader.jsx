/* ==== src/components/Header/PersonalBoardSubHeader.jsx (v7 - Fix Aria Hidden + Test Background) ==== */
import React, { useState, useEffect, useRef, useCallback } from "react";
import Slider from "react-slick";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Form } from "react-bootstrap";
import { FaChevronDown, FaPlus, FaTrashAlt, FaEdit } from "react-icons/fa";

import api from "../../services/api";
import authService from "../../services/authService";

import "./PersonalBoardSubHeader.css";

const DEFAULT_PERSONAL_BOARD_BACKGROUND = "blackboard.jpg";

const PersonalBoardSubHeader = ({
  selectedBoard,
  setSelectedBoard,
  boards,
  setBoards,
  fetchPersonalBoards,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [selectedBackgroundUI, setSelectedBackgroundUI] = useState(
    DEFAULT_PERSONAL_BOARD_BACKGROUND
  );
  const [editedBoardName, setEditedBoardName] = useState("");
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const editInputRef = useRef(null);
  const sliderRef = useRef(null);
  const subHeaderRef = useRef(null);
  const dropdownContentRef = useRef(null);
  const lastScrollY = useRef(window.scrollY);
  // --- REF PER IL CONTENITORE DEL TITOLO ---
  const titleContainerRef = useRef(null);
  // -----------------------------------------

  const navigate = useNavigate();

  // --- EFFETTI ---
  useEffect(() => {
    let backgroundToSet = DEFAULT_PERSONAL_BOARD_BACKGROUND;
    let boardIndex = -1;
    if (selectedBoard) {
      backgroundToSet =
        selectedBoard.userBackground ||
        selectedBoard.background ||
        DEFAULT_PERSONAL_BOARD_BACKGROUND;
      if (Array.isArray(boards)) {
        boardIndex = boards.findIndex(
          (b) => String(b?.id) === String(selectedBoard.id)
        );
      }
    }
    setSelectedBackgroundUI(backgroundToSet);
    if (sliderRef.current && boardIndex !== -1) {
      setTimeout(() => {
        if (
          sliderRef.current &&
          typeof sliderRef.current.slickGoTo === "function"
        ) {
          sliderRef.current.slickGoTo(boardIndex);
        }
      }, 150);
    }
  }, [selectedBoard, boards]);

  useEffect(() => {
    if (showEditModal && editInputRef.current) {
      setTimeout(() => editInputRef.current.focus(), 100);
    }
  }, [showEditModal]);

  useEffect(() => {
    let scrollTimeout;
    const handleWindowScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const currentScrollY = window.scrollY;
        const scrollThreshold = 20;
        if (
          isDropdownOpen &&
          currentScrollY < lastScrollY.current - scrollThreshold
        ) {
          setIsDropdownOpen(false);
        }
        lastScrollY.current = currentScrollY <= 0 ? 0 : currentScrollY;
      }, 50);
    };
    const handleClickOutside = (event) => {
      if (
        isDropdownOpen &&
        subHeaderRef.current &&
        !subHeaderRef.current.contains(event.target) &&
        !event.target.closest(".modal-dialog")
      ) {
        setIsDropdownOpen(false);
      }
    };
    const dropdownElement = dropdownContentRef.current;
    const stopPropagation = (event) => {
      if (
        dropdownElement &&
        dropdownElement.scrollHeight > dropdownElement.clientHeight
      ) {
        const isAtTop = dropdownElement.scrollTop === 0;
        const isAtBottom =
          dropdownElement.scrollHeight - dropdownElement.scrollTop ===
          dropdownElement.clientHeight;
        if ((event.deltaY < 0 && isAtTop) || (event.deltaY > 0 && isAtBottom)) {
          return;
        }
        event.stopPropagation();
      }
    };
    if (isDropdownOpen) {
      lastScrollY.current = window.scrollY;
      window.addEventListener("scroll", handleWindowScroll, { passive: true });
      document.addEventListener("mousedown", handleClickOutside);
      if (dropdownElement)
        dropdownElement.addEventListener("wheel", stopPropagation, {
          passive: false,
        });
    }
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      document.removeEventListener("mousedown", handleClickOutside);
      if (dropdownElement)
        dropdownElement.removeEventListener("wheel", stopPropagation);
      clearTimeout(scrollTimeout);
    };
  }, [isDropdownOpen]);

  // --- HANDLERS AZIONI ---
  const toggleDropdown = useCallback((e) => {
    e?.stopPropagation();
    setIsDropdownOpen((prev) => !prev);
  }, []);
  const handleSelectBoard = useCallback(
    (board) => {
      if (!board || String(board.id) === String(selectedBoard?.id)) {
        if (isDropdownOpen) setIsDropdownOpen(false);
        return;
      }
      if (typeof setSelectedBoard === "function") {
        setSelectedBoard(board);
        setIsDropdownOpen(false);
      } else {
        console.error("[SubHeader] setSelectedBoard prop is not a function!");
      }
    },
    [selectedBoard, setSelectedBoard, isDropdownOpen]
  );
  const handleOpenAddModal = useCallback((e) => {
    e?.stopPropagation();
    setNewBoardName("");
    setShowAddModal(true);
    setIsDropdownOpen(false);
  }, []);
  const handleCloseAddModal = useCallback(() => setShowAddModal(false), []);
  const handleAddBoard = useCallback(async () => {
    const trimmedName = newBoardName.trim();
    if (!trimmedName) {
      toast.error("Il nome della lavagna non può essere vuoto.");
      return;
    }
    handleCloseAddModal();
    try {
      const response = await api.post(`/auth/boards`, {
        name: trimmedName,
        background: DEFAULT_PERSONAL_BOARD_BACKGROUND,
        is_default: boards?.length === 0 ? 1 : 0,
      });
      const newBoard = response.data;
      if (
        newBoard &&
        typeof setBoards === "function" &&
        typeof setSelectedBoard === "function"
      ) {
        setBoards((prevBoards) =>
          [...(prevBoards || []), newBoard].sort((a, b) => {
            if (
              (a.is_default === 1 || a.is_default === true) &&
              !(b.is_default === 1 || b.is_default === true)
            )
              return -1;
            if (
              !(a.is_default === 1 || a.is_default === true) &&
              (b.is_default === 1 || b.is_default === true)
            )
              return 1;
            return (a.name || "").localeCompare(b.name || "");
          })
        );
        setSelectedBoard(newBoard);
        toast.success(`Lavagna "${trimmedName}" creata!`);
      } else {
        throw new Error("Errore aggiornamento stato o risposta API.");
      }
    } catch (error) {
      console.error("[SubHeader] Errore creazione lavagna:", error);
      toast.error(error.response?.data?.message || "Errore creazione lavagna.");
    }
  }, [newBoardName, boards, setBoards, setSelectedBoard, handleCloseAddModal]);
  const handleOpenDeleteModal = useCallback(
    (e) => {
      e?.stopPropagation();
      if (selectedBoard) {
        if (
          selectedBoard.is_default === 1 ||
          selectedBoard.is_default === true
        ) {
          toast.warn("La lavagna di default non può essere eliminata.");
        } else {
          setBoardToDelete(selectedBoard);
          setShowDeleteModal(true);
          setIsDropdownOpen(false);
        }
      }
    },
    [selectedBoard]
  );
  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setBoardToDelete(null);
  }, []);
  const confirmDeleteBoard = useCallback(async () => {
    if (
      !boardToDelete ||
      boardToDelete.is_default === 1 ||
      boardToDelete.is_default === true
    )
      return;
    const boardIdToDelete = boardToDelete.id;
    const boardNameToDelete = boardToDelete.name;
    handleCloseDeleteModal();
    try {
      await api.delete(`/auth/boards/${boardIdToDelete}`);
      if (
        typeof setBoards === "function" &&
        typeof setSelectedBoard === "function"
      ) {
        const remainingBoards = (boards || []).filter(
          (b) => b.id !== boardIdToDelete
        );
        setBoards(remainingBoards);
        if (selectedBoard && selectedBoard.id === boardIdToDelete) {
          let nextBoard = null;
          if (remainingBoards.length > 0) {
            nextBoard =
              remainingBoards.find(
                (b) => b.is_default === 1 || b.is_default === true
              ) || remainingBoards[0];
          }
          setSelectedBoard(nextBoard);
          if (!nextBoard && remainingBoards.length === 0) {
            navigate("/dashboard", { replace: true });
            toast.info("Nessuna lavagna rimasta, tornato alla dashboard.");
          }
        }
        toast.success(`Lavagna "${boardNameToDelete}" eliminata.`);
      } else {
        throw new Error("Errore aggiornamento stato.");
      }
    } catch (error) {
      console.error("[SubHeader] Errore eliminazione lavagna:", error);
      toast.error(
        error.response?.data?.message || "Errore eliminazione lavagna."
      );
    }
  }, [
    boardToDelete,
    boards,
    selectedBoard,
    setBoards,
    setSelectedBoard,
    handleCloseDeleteModal,
    navigate,
  ]);
  const handleOpenEditModal = useCallback(
    (e) => {
      e?.stopPropagation();
      if (selectedBoard) {
        if (
          selectedBoard.is_default === 1 ||
          selectedBoard.is_default === true
        ) {
          toast.warn(
            "Il nome della lavagna di default non può essere modificato."
          );
        } else {
          setEditedBoardName(selectedBoard.name);
          setShowEditModal(true);
          setIsDropdownOpen(false);
        }
      }
    },
    [selectedBoard]
  );
  const handleCloseEditModal = useCallback(() => {
    setEditedBoardName("");
    setShowEditModal(false);
  }, []);
  const handleUpdateSelectedBoardName = useCallback(async () => {
    const trimmedName = editedBoardName.trim();
    if (
      !selectedBoard ||
      selectedBoard.is_default === 1 ||
      selectedBoard.is_default === true
    )
      return;
    if (!trimmedName) {
      toast.error("Il nome non può essere vuoto.");
      return;
    }
    if (trimmedName === selectedBoard.name) {
      handleCloseEditModal();
      return;
    }
    const boardIdToUpdate = selectedBoard.id;
    handleCloseEditModal();
    try {
      const payload = { name: trimmedName };
      const response = await api.put(
        `/auth/boards/${boardIdToUpdate}`,
        payload
      );
      const updatedBoard = response.data;
      if (
        updatedBoard &&
        typeof setBoards === "function" &&
        typeof setSelectedBoard === "function"
      ) {
        setBoards((prevBoards) =>
          (prevBoards || [])
            .map((b) => (b.id === boardIdToUpdate ? updatedBoard : b))
            .sort((a, b) => {
              if (
                (a.is_default === 1 || a.is_default === true) &&
                !(b.is_default === 1 || b.is_default === true)
              )
                return -1;
              if (
                !(a.is_default === 1 || a.is_default === true) &&
                (b.is_default === 1 || b.is_default === true)
              )
                return 1;
              return (a.name || "").localeCompare(b.name || "");
            })
        );
        if (selectedBoard.id === updatedBoard.id) {
          setSelectedBoard(updatedBoard);
          if (!updatedBoard.groupId) {
            localStorage.setItem("selectedBoard", JSON.stringify(updatedBoard));
          }
        }
        toast.success("Nome lavagna aggiornato!");
      } else {
        throw new Error("Errore aggiornamento stato o risposta API.");
      }
    } catch (error) {
      console.error("[SubHeader] Errore aggiornamento nome:", error);
      toast.error(
        error.response?.data?.message || "Errore aggiornamento nome."
      );
    }
  }, [
    editedBoardName,
    selectedBoard,
    boards,
    setBoards,
    setSelectedBoard,
    handleCloseEditModal,
  ]);
  const handleTitleDoubleClick = useCallback(() => {
    if (
      selectedBoard &&
      selectedBoard.is_default !== 1 &&
      selectedBoard.is_default !== true
    ) {
      handleOpenEditModal();
    }
  }, [selectedBoard, handleOpenEditModal]);

  // --- MODIFICA handleChangeBackground PER SPOSTARE FOCUS ---
  const handleChangeBackground = useCallback(
    async (newBackgroundValue) => {
      // 1. Sposta il focus PRIMA di chiudere
      if (titleContainerRef.current) {
        console.log("Attempting to focus title container..."); // Log per debug
        titleContainerRef.current.focus();
      } else {
        console.warn("titleContainerRef.current is null, cannot focus.");
      }

      // 2. Chiudi il dropdown (ora il focus non è più sul select)
      setIsDropdownOpen(false);

      // 3. Procedi con la logica di salvataggio (invariata)
      if (!selectedBoard) {
        toast.error("Seleziona prima una lavagna.");
        return;
      }
      const currentEffectiveBackground =
        selectedBoard.userBackground ||
        selectedBoard.background ||
        DEFAULT_PERSONAL_BOARD_BACKGROUND;
      if (newBackgroundValue === currentEffectiveBackground) return;
      const oldBackgroundUI = selectedBackgroundUI;
      setSelectedBackgroundUI(newBackgroundValue);
      try {
        await api.put(
          `/auth/user-settings/boards/${selectedBoard.id}/background`,
          { background: newBackgroundValue }
        );
        toast.info("Sfondo personalizzato salvato!");
        const updatedBoardData = {
          ...selectedBoard,
          userBackground: newBackgroundValue,
        };
        if (typeof setSelectedBoard === "function")
          setSelectedBoard(updatedBoardData);
        if (typeof setBoards === "function")
          setBoards((prevBoards) =>
            (prevBoards || []).map((b) =>
              b.id === selectedBoard.id ? updatedBoardData : b
            )
          );
        if (!selectedBoard.groupId)
          localStorage.setItem(
            "selectedBoard",
            JSON.stringify(updatedBoardData)
          );

        // Codice Test (invariato)
        const testUserId = authService.getCurrentUserId
          ? authService.getCurrentUserId()
          : null;
        if (testUserId && selectedBoard) {
          const storageKey = `test_user_${testUserId}_board_${selectedBoard.id}_bg`;
          localStorage.setItem(storageKey, newBackgroundValue);
          console.log(
            `[TEST] Saved simulated BG for board ${selectedBoard.id} to key ${storageKey}: ${newBackgroundValue}`
          );
        } else {
          console.warn(
            "[TEST] Cannot save simulated background: User ID or Selected Board not available."
          );
        }
      } catch (error) {
        console.error("[SubHeader] Errore salvataggio sfondo:", error);
        toast.error(
          error.response?.data?.message || "Errore salvataggio sfondo."
        );
        setSelectedBackgroundUI(oldBackgroundUI);
      }
    },
    [selectedBoard, setSelectedBoard, setBoards, selectedBackgroundUI] // Rimosso titleContainerRef dalle dipendenze (non serve)
  );
  // --- FINE MODIFICA ---

  // --- Slider Settings ---
  const sliderSettings = {
    /* ... (invariato) ... */ dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: Math.min(boards?.length || 1, 5),
    slidesToScroll: 1,
    variableWidth: true,
    swipeToSlide: true,
    arrows: (boards?.length || 0) > Math.min(boards?.length || 1, 5),
  };

  // --- Rendering ---
  const showPlaceholder =
    !Array.isArray(boards) || boards.length === 0 || !selectedBoard;
  if (showPlaceholder) {
    /* ... (Rendering Placeholder invariato) ... */
    if (!Array.isArray(boards)) {
      return (
        <div
          ref={subHeaderRef}
          className="sub-header-container personal-board-subheader placeholder"
        >
          {" "}
          <div className="sub-header-top">
            {" "}
            <span
              className="font-primary"
              style={{ opacity: 0.7, fontSize: "1.5rem" }}
            >
              {" "}
              Caricamento...{" "}
            </span>{" "}
          </div>{" "}
        </div>
      );
    }
    if (boards.length === 0) {
      return (
        <>
          {" "}
          <div
            ref={subHeaderRef}
            className="sub-header-container personal-board-subheader"
          >
            {" "}
            <div className="sub-header-top">
              {" "}
              <div className="board-title-container no-boards">
                {" "}
                <h2 className="sub-header-title font-primary">
                  {" "}
                  Nessuna Lavagna Personale{" "}
                </h2>{" "}
              </div>{" "}
              <div className="sub-header-buttons">
                {" "}
                <button
                  className="icon-button"
                  onClick={handleOpenAddModal}
                  title="Crea la prima lavagna"
                >
                  {" "}
                  <FaPlus />{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
            {" "}
            <Modal.Header closeButton>
              {" "}
              <Modal.Title className="font-primary">
                {" "}
                Crea Prima Lavagna Personale{" "}
              </Modal.Title>{" "}
            </Modal.Header>{" "}
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddBoard();
              }}
            >
              {" "}
              <Modal.Body>
                {" "}
                <Form.Group controlId="addBoardNamePlaceholder">
                  {" "}
                  <Form.Label className="font-secondary">
                    {" "}
                    Nome Lavagna{" "}
                  </Form.Label>{" "}
                  <Form.Control
                    type="text"
                    className="font-secondary"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    autoFocus
                    required
                    placeholder="Es. Lista Spesa Settimanale"
                  />{" "}
                  <Form.Control.Feedback type="invalid">
                    {" "}
                    Il nome è obbligatorio.{" "}
                  </Form.Control.Feedback>{" "}
                </Form.Group>{" "}
              </Modal.Body>{" "}
              <Modal.Footer>
                {" "}
                <Button variant="secondary" onClick={handleCloseAddModal}>
                  Annulla
                </Button>{" "}
                <Button
                  variant="primary"
                  type="submit"
                  disabled={!newBoardName.trim()}
                >
                  {" "}
                  Crea{" "}
                </Button>{" "}
              </Modal.Footer>{" "}
            </Form>{" "}
          </Modal>{" "}
        </>
      );
    }
    if (!selectedBoard) {
      return (
        <div
          ref={subHeaderRef}
          className="sub-header-container personal-board-subheader placeholder"
        >
          {" "}
          <div className="sub-header-top">
            {" "}
            <span
              className="font-primary"
              style={{ opacity: 0.7, fontSize: "1.5rem" }}
            >
              {" "}
              Seleziona una lavagna...{" "}
            </span>{" "}
          </div>{" "}
        </div>
      );
    }
  }

  const currentBoardName = selectedBoard.name;
  const isDefault =
    selectedBoard.is_default === 1 || selectedBoard.is_default === true;

  return (
    <>
      <div
        ref={subHeaderRef}
        className="sub-header-container personal-board-subheader"
      >
        {/* Parte Superiore */}
        <div className="sub-header-top">
          {/* --- AGGIUNTO ref e tabIndex AL CONTENITORE DEL TITOLO --- */}
          <div
            ref={titleContainerRef} // <-- Assegna il ref
            tabIndex={-1} // <-- Rendi focusabile programmaticamente (ma non con Tab)
            className="board-title-container"
            onClick={toggleDropdown}
            title="Seleziona lavagna"
          >
            {/* ----------------------------------------------------- */}
            <h2
              className="sub-header-title font-primary"
              onDoubleClick={handleTitleDoubleClick}
              title={
                isDefault
                  ? currentBoardName
                  : `Clicca per selezionare, doppio click per rinominare`
              }
            >
              {currentBoardName}
              {isDefault && (
                <span className="default-tag-inline">(Default)</span>
              )}
              <FaChevronDown
                className={`chevron-icon ${isDropdownOpen ? "open" : ""}`}
              />
            </h2>
          </div>
          <div className="sub-header-buttons">
            {/* ... Bottoni Add, Edit, Delete ... */}
            <button
              className="icon-button"
              onClick={handleOpenAddModal}
              title="Aggiungi Nuova Lavagna"
            >
              <FaPlus />
            </button>
            <button
              className="icon-button"
              onClick={handleOpenEditModal}
              disabled={isDefault}
              title={
                isDefault
                  ? "Nome Default non modificabile"
                  : "Modifica Nome Lavagna"
              }
            >
              <FaEdit />
            </button>
            <button
              className="icon-button"
              onClick={handleOpenDeleteModal}
              disabled={isDefault}
              title={isDefault ? "Default non eliminabile" : "Elimina Lavagna"}
            >
              <FaTrashAlt />
            </button>
          </div>
        </div>

        {/* Contenuto Dropdown */}
        <div
          ref={dropdownContentRef}
          className={`sub-header-dropdown-content ${isDropdownOpen ? "show" : ""}`}
          aria-hidden={!isDropdownOpen}
        >
          {/* ... Slider e Select Sfondo ... */}
          <div className="sub-header-slider-container">
            {" "}
            {boards && boards.length > 0 ? (
              <Slider ref={sliderRef} {...sliderSettings}>
                {" "}
                {boards.map((board) => (
                  <div key={board.id} className="board-slide-item-wrapper">
                    {" "}
                    <span
                      className={`board-slide-item font-secondary ${selectedBoard.id === board.id ? "selected" : ""} ${board.is_default === 1 || board.is_default === true ? "default-board" : ""}`}
                      onClick={() => handleSelectBoard(board)}
                      role="button"
                      tabIndex={isDropdownOpen ? 0 : -1}
                      title={board.name}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSelectBoard(board)
                      }
                    >
                      {" "}
                      {board.name}{" "}
                    </span>{" "}
                  </div>
                ))}{" "}
              </Slider>
            ) : (
              <span className="board-slide-item disabled font-secondary">
                {" "}
                Nessuna lavagna.{" "}
              </span>
            )}{" "}
          </div>
          <div className="sub-header-bottom">
            {" "}
            <div className="controls-row">
              {" "}
              <div className="background-selector">
                {" "}
                <label
                  htmlFor={`personal-bg-choice-${selectedBoard.id}`}
                  className="font-primary"
                >
                  {" "}
                  Mio Sfondo:{" "}
                </label>{" "}
                <select
                  id={`personal-bg-choice-${selectedBoard.id}`}
                  className="font-secondary"
                  value={selectedBackgroundUI}
                  onChange={(e) => handleChangeBackground(e.target.value)}
                >
                  {" "}
                  <option value="blackboard.jpg">Blackboard</option>{" "}
                  <option value="frettolosa.jpg">Frettolosa</option>{" "}
                  <option value="gesso.jpg">Gesso</option>{" "}
                  <option value="thun.jpg">Thun</option>{" "}
                  <option value="lavata.jpg">Lavata</option>{" "}
                  <option value="nera.jpg">Nera</option>{" "}
                  <option value="graffiata.jpg">Graffiata</option>{" "}
                  <option value="verde.jpg">Verde</option>{" "}
                  <option value="default-background.jpg">Default Chiaro</option>{" "}
                </select>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        </div>
      </div>

      {/* --- MODALI --- */}
      {/* ... (Modali Add, Edit, Delete invariate) ... */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
        {" "}
        <Modal.Header closeButton>
          {" "}
          <Modal.Title className="font-primary">
            Aggiungi Lavagna Personale
          </Modal.Title>{" "}
        </Modal.Header>{" "}
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddBoard();
          }}
        >
          {" "}
          <Modal.Body>
            {" "}
            <Form.Group controlId="addBoardNameModal">
              {" "}
              <Form.Label className="font-secondary">
                Nome Nuova Lavagna
              </Form.Label>{" "}
              <Form.Control
                type="text"
                className="font-secondary"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                autoFocus
                required
                placeholder="Nome della lavagna"
              />{" "}
              <Form.Control.Feedback type="invalid">
                Il nome è obbligatorio.
              </Form.Control.Feedback>{" "}
            </Form.Group>{" "}
          </Modal.Body>{" "}
          <Modal.Footer>
            {" "}
            <Button variant="secondary" onClick={handleCloseAddModal}>
              Annulla
            </Button>{" "}
            <Button
              variant="primary"
              type="submit"
              disabled={!newBoardName.trim()}
            >
              Aggiungi
            </Button>{" "}
          </Modal.Footer>{" "}
        </Form>{" "}
      </Modal>
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
        {" "}
        <Modal.Header closeButton>
          {" "}
          <Modal.Title className="font-primary">
            Modifica Nome Lavagna
          </Modal.Title>{" "}
        </Modal.Header>{" "}
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateSelectedBoardName();
          }}
        >
          {" "}
          <Modal.Body>
            {" "}
            <Form.Group controlId="editBoardNameModal">
              {" "}
              <Form.Label className="font-secondary">
                Nuovo Nome
              </Form.Label>{" "}
              <Form.Control
                ref={editInputRef}
                type="text"
                className="font-secondary"
                value={editedBoardName}
                onChange={(e) => setEditedBoardName(e.target.value)}
                required
                placeholder="Nuovo nome"
              />{" "}
              <Form.Control.Feedback type="invalid">
                Il nome è obbligatorio.
              </Form.Control.Feedback>{" "}
            </Form.Group>{" "}
          </Modal.Body>{" "}
          <Modal.Footer>
            {" "}
            <Button variant="secondary" onClick={handleCloseEditModal}>
              Annulla
            </Button>{" "}
            <Button
              variant="primary"
              type="submit"
              disabled={
                !editedBoardName.trim() ||
                editedBoardName.trim() === selectedBoard?.name
              }
            >
              Salva
            </Button>{" "}
          </Modal.Footer>{" "}
        </Form>{" "}
      </Modal>
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        {" "}
        <Modal.Header closeButton>
          {" "}
          <Modal.Title className="font-primary">
            Conferma Eliminazione
          </Modal.Title>{" "}
        </Modal.Header>{" "}
        <Modal.Body className="font-secondary">
          {" "}
          Sei sicuro di voler eliminare la lavagna personale "
          <strong className="font-secondary">{boardToDelete?.name}</strong>"?
          L'azione è irreversibile.{" "}
        </Modal.Body>{" "}
        <Modal.Footer>
          {" "}
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Annulla
          </Button>{" "}
          <Button variant="danger" onClick={confirmDeleteBoard}>
            Elimina
          </Button>{" "}
        </Modal.Footer>{" "}
      </Modal>
    </>
  );
};

export default PersonalBoardSubHeader;
