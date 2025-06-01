/* ==== src/components/GroupDashboard/GroupDetail/GroupHeader.jsx (v35 - Pulsante Chatbot + Icona/Testo Ruolo a Destra - Completo) ==== */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Slider from "react-slick";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGroup } from "../../../contexts/GroupContext";
import api from "../../../services/api";
import { toast } from "react-toastify";
import {
  FaChevronDown,
  FaPlus,
  FaTrashAlt,
  FaEdit,
  FaUsersCog,
  FaSync,
  FaRobot, // <--- IMPORT ICONA ROBOT
} from "react-icons/fa";
import { Modal, Button, Form } from "react-bootstrap";
import "../../Header/PersonalBoardSubHeader.css"; // Assicurati che il path sia corretto

const DEFAULT_GROUP_BOARD_BACKGROUND = "blackboard.jpg";

const GroupHeader = ({
  currentBoardData,
  allGroupBoards = [],
  onBoardSelect,
  onDataNeedsRefresh,
  isLoadingBoards,
  hasUpdates,
  onRefreshClick,
  onToggleChatbot, // <--- PROP PER GESTIRE CHATBOT
}) => {
  // Log e Stati interni... (come prima)
  console.log("--- GroupHeader RENDER ---");
  try {
    console.log(
      "[GroupHeader DEBUG] Prop currentBoardData ricevuta:",
      JSON.stringify(currentBoardData, null, 2)
    );
  } catch (e) {
    console.log(
      "[GroupHeader DEBUG] Prop currentBoardData ricevuta (stringify fallito):",
      currentBoardData
    );
  }
  console.log(
    "[GroupHeader DEBUG] Valore userRole dalla prop:",
    currentBoardData?.userRole
  );
  console.log(
    "[GroupHeader DEBUG] Tipo di userRole dalla prop:",
    typeof currentBoardData?.userRole
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [selectedBackgroundUI, setSelectedBackgroundUI] = useState(
    DEFAULT_GROUP_BOARD_BACKGROUND
  );
  const [editedBoardName, setEditedBoardName] = useState("");
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const editInputRef = useRef(null);
  const sliderRef = useRef(null);
  const subHeaderRef = useRef(null);
  const dropdownContentRef = useRef(null);
  const lastScrollY = useRef(window.scrollY);

  const { groupId, boardId } = useParams();
  const navigate = useNavigate();
  const {
    currentGroup,
    loading: groupLoading,
    createBoard: createBoardInContext,
    deleteBoard: deleteBoardInContext,
  } = useGroup();

  // Dati derivati (inclusa info ruolo)
  const userRole = useMemo(
    () => currentBoardData?.userRole,
    [currentBoardData]
  );
  const isCurrentBoardDefault = useMemo(
    () => !!currentBoardData?.is_group_default,
    [currentBoardData]
  );
  const roleDisplayInfo = useMemo(() => {
    const role = currentBoardData?.userRole;
    console.log(
      "[GroupHeader DEBUG] Calcolo roleDisplayInfo - Valore ruolo usato:",
      role
    );
    switch (role) {
      case "admin":
        return { icon: "👑", text: "Amministratore" };
      case "level1":
        return { icon: "✏️", text: "Editor" };
      case "level2":
        return { icon: "✍️", text: "Contributor" };
      default:
        return null;
    }
  }, [currentBoardData?.userRole]);
  console.log(
    "[GroupHeader DEBUG] Valore finale roleDisplayInfo:",
    roleDisplayInfo
  );

  // Permessi UI (invariati)
  const canAddBoard = useCallback(() => userRole === "admin", [userRole]);
  const canEditCurrentBoardName = useCallback(
    () => userRole === "admin" && !isCurrentBoardDefault,
    [userRole, isCurrentBoardDefault]
  );
  const canDeleteCurrentBoard = useCallback(
    () => userRole === "admin" && !isCurrentBoardDefault,
    [userRole, isCurrentBoardDefault]
  );
  const canChangePersonalBackground = useCallback(() => !!userRole, [userRole]);

  // Effetti (invariati)
  useEffect(() => {
    let bgToSet =
      currentBoardData?.userBackground ||
      currentBoardData?.background ||
      DEFAULT_GROUP_BOARD_BACKGROUND;
    setSelectedBackgroundUI(bgToSet);
    if (
      sliderRef.current &&
      Array.isArray(allGroupBoards) &&
      allGroupBoards.length > 0 &&
      boardId
    ) {
      const numericBoardId = parseInt(boardId);
      const idx = allGroupBoards.findIndex((b) => b.id === numericBoardId);
      if (idx !== -1) {
        setTimeout(() => {
          if (
            sliderRef.current &&
            typeof sliderRef.current.slickGoTo === "function"
          )
            sliderRef.current.slickGoTo(idx);
        }, 150);
      }
    }
  }, [currentBoardData, boardId, allGroupBoards]);
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
          Math.abs(
            dropdownElement.scrollHeight -
              dropdownElement.scrollTop -
              dropdownElement.clientHeight
          ) < 1;
        if (
          !((event.deltaY < 0 && isAtTop) || (event.deltaY > 0 && isAtBottom))
        ) {
          event.stopPropagation();
        }
      }
    };
    if (isDropdownOpen) {
      lastScrollY.current = window.scrollY;
      window.addEventListener("scroll", handleWindowScroll, { passive: true });
      document.addEventListener("mousedown", handleClickOutside);
      if (dropdownElement) {
        if (dropdownElement.scrollHeight > dropdownElement.clientHeight) {
          dropdownElement.addEventListener("wheel", stopPropagation, {
            passive: false,
          });
        }
      }
    }
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      document.removeEventListener("mousedown", handleClickOutside);
      if (dropdownElement) {
        dropdownElement.removeEventListener("wheel", stopPropagation);
      }
      clearTimeout(scrollTimeout);
    };
  }, [isDropdownOpen]);

  // Handlers UI (inclusa chiamata onToggleChatbot)
  const toggleDropdown = useCallback((e) => {
    e?.stopPropagation();
    setIsDropdownOpen((prev) => !prev);
  }, []);
  const handleSelectBoard = useCallback(
    (selectedBoardId) => {
      if (String(selectedBoardId) !== String(boardId)) {
        setIsDropdownOpen(false);
        if (onBoardSelect) onBoardSelect(selectedBoardId);
        else navigate(`/groups/${groupId}/boards/${selectedBoardId}`);
      } else {
        setIsDropdownOpen(false);
      }
    },
    [boardId, groupId, navigate, onBoardSelect]
  );
  const handleOpenAddModal = useCallback(
    (e) => {
      e?.stopPropagation();
      if (canAddBoard()) {
        setNewBoardName("");
        setShowAddModal(true);
        setIsDropdownOpen(false);
      } else {
        toast.warn("Solo gli amministratori possono aggiungere lavagne.");
      }
    },
    [canAddBoard]
  );
  const handleCloseAddModal = useCallback(() => setShowAddModal(false), []);
  const handleAddBoard = useCallback(async () => {
    if (!canAddBoard()) return;
    const trimmedName = newBoardName.trim();
    if (!trimmedName) {
      toast.error("Nome obbligatorio.");
      return;
    }
    handleCloseAddModal();
    try {
      const newBoard = await createBoardInContext(
        trimmedName,
        DEFAULT_GROUP_BOARD_BACKGROUND
      );
      if (newBoard?.id) {
        toast.success(`Lavagna "${trimmedName}" creata!`);
        navigate(`/groups/${groupId}/boards/${newBoard.id}`);
      } else {
        toast.error("Errore nella creazione della lavagna.");
      }
    } catch (error) {
      console.error("[GroupHeader] Errore handleAddBoard:", error);
      toast.error(error.response?.data?.message || "Errore creazione lavagna.");
    }
  }, [
    canAddBoard,
    newBoardName,
    handleCloseAddModal,
    createBoardInContext,
    navigate,
    groupId,
  ]);
  const handleOpenEditModal = useCallback(
    (e) => {
      e?.stopPropagation();
      if (canEditCurrentBoardName() && currentBoardData) {
        setEditedBoardName(currentBoardData.name);
        setShowEditModal(true);
        setIsDropdownOpen(false);
      } else {
        if (isCurrentBoardDefault)
          toast.warn(
            "Il nome della lavagna di default non può essere modificato."
          );
        else
          toast.warn(
            "Solo gli amministratori possono modificare il nome delle lavagne."
          );
      }
    },
    [canEditCurrentBoardName, currentBoardData, isCurrentBoardDefault]
  );
  const handleCloseEditModal = useCallback(() => {
    setEditedBoardName("");
    setShowEditModal(false);
  }, []);
  const handleUpdateBoardName = useCallback(async () => {
    if (!canEditCurrentBoardName()) return;
    const trimmedName = editedBoardName.trim();
    if (!trimmedName) {
      toast.error("Nome obbligatorio.");
      return;
    }
    if (!currentBoardData || trimmedName === currentBoardData.name) {
      handleCloseEditModal();
      return;
    }
    const boardIdToUpdate = currentBoardData.id;
    handleCloseEditModal();
    try {
      await api.put(`/auth/groups/${groupId}/boards/${boardIdToUpdate}`, {
        name: trimmedName,
      });
      toast.success("Nome aggiornato!");
      if (onDataNeedsRefresh) onDataNeedsRefresh();
    } catch (error) {
      console.error("[GroupHeader] Errore handleUpdateBoardName:", error);
      toast.error(
        error.response?.data?.message || "Errore aggiornamento nome."
      );
    }
  }, [
    canEditCurrentBoardName,
    editedBoardName,
    currentBoardData,
    handleCloseEditModal,
    groupId,
    onDataNeedsRefresh,
  ]);
  const handleTitleDoubleClick = useCallback(() => {
    if (canEditCurrentBoardName()) {
      handleOpenEditModal();
    } else {
      if (isCurrentBoardDefault)
        toast.warn(
          "Il nome della lavagna di default non può essere modificato."
        );
      else toast.warn("Solo gli amministratori possono modificare il nome.");
    }
  }, [canEditCurrentBoardName, handleOpenEditModal, isCurrentBoardDefault]);
  const handleSaveBackground = useCallback(
    async (newBackgroundValue) => {
      setIsDropdownOpen(false);
      if (!canChangePersonalBackground() || !currentBoardData) return;
      const currentEffectiveBackground =
        currentBoardData.userBackground ||
        currentBoardData.background ||
        DEFAULT_GROUP_BOARD_BACKGROUND;
      if (newBackgroundValue === currentEffectiveBackground) return;
      const oldBackgroundUI = selectedBackgroundUI;
      setSelectedBackgroundUI(newBackgroundValue);
      try {
        await api.put(`/auth/user-settings/boards/${boardId}/background`, {
          background: newBackgroundValue,
        });
        toast.info("Sfondo personale salvato!");
        if (onDataNeedsRefresh) onDataNeedsRefresh();
      } catch (error) {
        console.error("[GroupHeader] Errore salvataggio sfondo:", error);
        toast.error(
          error.response?.data?.message || "Errore salvataggio sfondo."
        );
        setSelectedBackgroundUI(oldBackgroundUI);
      }
    },
    [
      canChangePersonalBackground,
      currentBoardData,
      boardId,
      selectedBackgroundUI,
      onDataNeedsRefresh,
    ]
  );
  const handleOpenDeleteModal = useCallback(
    (e) => {
      e?.stopPropagation();
      if (canDeleteCurrentBoard()) {
        setBoardToDelete(currentBoardData);
        setShowDeleteModal(true);
        setIsDropdownOpen(false);
      } else {
        if (isCurrentBoardDefault)
          toast.warn("La lavagna di default non può essere eliminata.");
        else
          toast.warn("Solo gli amministratori possono eliminare le lavagne.");
      }
    },
    [canDeleteCurrentBoard, currentBoardData, isCurrentBoardDefault]
  );
  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setBoardToDelete(null);
  }, []);
  const confirmDeleteBoard = useCallback(async () => {
    if (!canDeleteCurrentBoard() || !boardToDelete) return;
    const boardIdToDelete = boardToDelete.id;
    const boardNameToDelete = boardToDelete.name;
    handleCloseDeleteModal();
    try {
      await deleteBoardInContext(boardIdToDelete);
      toast.success(`Lavagna "${boardNameToDelete}" eliminata.`);
      navigate(`/groups/${groupId}`, { replace: true });
    } catch (error) {
      console.error("[GroupHeader] Errore confirmDeleteBoard:", error);
      toast.error(
        error.response?.data?.message || "Errore eliminazione lavagna."
      );
    }
  }, [
    canDeleteCurrentBoard,
    boardToDelete,
    handleCloseDeleteModal,
    deleteBoardInContext,
    navigate,
    groupId,
  ]);
  const handleManageGroupClick = useCallback(
    (e) => {
      e?.stopPropagation();
      setIsDropdownOpen(false);
      navigate(`/groups/${groupId}`);
    },
    [navigate, groupId]
  );
  const handleChatbotButtonClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (typeof onToggleChatbot === "function") {
        onToggleChatbot();
      } else {
        console.error("onToggleChatbot prop non è una funzione!");
      }
    },
    [onToggleChatbot]
  );

  // Slider Settings (invariato)
  const sliderSettings = useMemo(
    () => ({
      dots: false,
      infinite: false,
      speed: 400,
      slidesToShow: Math.min(allGroupBoards?.length || 1, 5),
      slidesToScroll: 1,
      variableWidth: true,
      swipeToSlide: true,
      arrows:
        (allGroupBoards?.length || 0) >
        Math.min(allGroupBoards?.length || 1, 5),
    }),
    [allGroupBoards?.length]
  );

  // Valori per Rendering (invariati)
  const currentBoardName =
    currentBoardData?.name || (groupLoading ? "Caricamento..." : "N/D");
  const groupNameDisplay =
    currentGroup?.name || (groupLoading ? "Gruppo..." : "Gruppo");

  // --- Rendering ---
  return (
    <>
      <div
        ref={subHeaderRef}
        className="sub-header-container group-board-subheader"
      >
        <div className="sub-header-top">
          {/* Titolo (Sinistra) */}
          <div
            className="board-title-container"
            onClick={toggleDropdown}
            title="Seleziona lavagna"
          >
            <h2
              className="sub-header-title font-primary"
              onDoubleClick={handleTitleDoubleClick}
              title={currentBoardName || ""}
            >
              <Link
                to={`/groups/${groupId}`}
                className="group-name-prefix font-secondary"
                onClick={(e) => e.stopPropagation()}
                title={`Vai ai dettagli del gruppo ${groupNameDisplay}`}
              >
                {" "}
                {groupNameDisplay}{" "}
              </Link>
              <span className="separator font-secondary">/</span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "300px",
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
                title={currentBoardName || ""}
              >
                {" "}
                {currentBoardName || "..."}{" "}
              </span>
              {isCurrentBoardDefault && (
                <span
                  className="default-tag-inline ms-1 font-secondary"
                  style={{ fontSize: "0.8em", verticalAlign: "middle" }}
                >
                  {" "}
                  (Default){" "}
                </span>
              )}
              <FaChevronDown
                className={`chevron-icon ms-1 ${isDropdownOpen ? "open" : ""}`}
                style={{ verticalAlign: "middle" }}
              />
              {hasUpdates && (
                <Button
                  variant="info"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRefreshClick) onRefreshClick();
                  }}
                  className="refresh-indicator-button ms-2"
                  title="Aggiornamenti disponibili! Clicca per ricaricare."
                  style={{
                    padding: "0.15rem 0.5rem",
                    fontSize: "0.85rem",
                    verticalAlign: "middle",
                    lineHeight: "1",
                  }}
                >
                  {" "}
                  <FaSync
                    style={{ fontSize: "0.9em", marginRight: "0.3em" }}
                  />{" "}
                  <span className="d-none d-md-inline">Aggiorna</span>{" "}
                </Button>
              )}
            </h2>
          </div>

          {/* Bottoni Azione + Ruolo + Chatbot (Destra) */}
          <div className="sub-header-buttons">
            <button
              className="icon-button"
              onClick={handleManageGroupClick}
              title="Gestisci Gruppo"
              disabled={groupLoading}
            >
              {" "}
              <FaUsersCog />{" "}
            </button>
            <span className="button-separator">|</span>
            <button
              className="icon-button"
              onClick={handleOpenAddModal}
              disabled={!canAddBoard() || groupLoading}
              title={canAddBoard() ? "Aggiungi Nuova Lavagna" : "Solo Admin"}
            >
              {" "}
              <FaPlus />{" "}
            </button>
            <button
              className="icon-button"
              onClick={handleOpenEditModal}
              disabled={!canEditCurrentBoardName() || groupLoading}
              title={
                canEditCurrentBoardName()
                  ? "Modifica Nome"
                  : isCurrentBoardDefault
                    ? "Nome Default non modificabile"
                    : "Solo Admin"
              }
            >
              {" "}
              <FaEdit />{" "}
            </button>
            <button
              className="icon-button"
              onClick={handleOpenDeleteModal}
              disabled={!canDeleteCurrentBoard() || groupLoading}
              title={
                canDeleteCurrentBoard()
                  ? "Elimina Lavagna"
                  : isCurrentBoardDefault
                    ? "Default non eliminabile"
                    : "Solo Admin"
              }
            >
              {" "}
              <FaTrashAlt />{" "}
            </button>

            {/* Indicatore Ruolo (Icona + Testo) */}
            {roleDisplayInfo && (
              <span
                className="user-role-level-tag ms-2"
                title={`Ruolo tecnico: ${currentBoardData?.userRole || "N/D"}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.9rem",
                  fontWeight: "normal",
                  color: "var(--color-text-light-gray)",
                  opacity: 0.9,
                  verticalAlign: "middle",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: "1.1em",
                    marginRight: "0.1em",
                    display: "inline-block",
                    verticalAlign: "middle",
                  }}
                >
                  {roleDisplayInfo.icon}
                </span>
                <span>{roleDisplayInfo.text}</span>
              </span>
            )}

            {/* NUOVO PULSANTE CHATBOT */}
            {userRole && typeof onToggleChatbot === "function" && (
              <button
                className="icon-button ms-2" // Potresti aggiungere qui: " chatbot-header-icon"
                onClick={handleChatbotButtonClick}
                title="Apri Assistente Ambrogio" // <-- ASSICURATI CHE QUESTO CI SIA (o simile con "Ambrogio")
                aria-label="Apri Assistente Ambrogio"
                disabled={groupLoading /* o altra condizione */}
              >
                <FaRobot />
              </button>
            )}
            {/* FINE NUOVO PULSANTE */}
          </div>
        </div>

        {/* Dropdown (invariato) */}
        <div
          ref={dropdownContentRef}
          className={`sub-header-dropdown-content ${isDropdownOpen ? "show" : ""}`}
        >
          <div className="sub-header-slider-container">
            {isLoadingBoards ? (
              <span className="board-slide-item disabled ms-3 font-secondary">
                Caricamento...
              </span>
            ) : Array.isArray(allGroupBoards) && allGroupBoards.length > 0 ? (
              <Slider ref={sliderRef} {...sliderSettings}>
                {" "}
                {allGroupBoards.map((board) => (
                  <div key={board.id} className="board-slide-item-wrapper">
                    {" "}
                    <span
                      className={`board-slide-item font-secondary ${String(board.id) === String(boardId) ? "selected" : ""} ${!!board.is_group_default ? "default-board" : ""}`}
                      onClick={() => handleSelectBoard(board.id)}
                      role="button"
                      tabIndex={isDropdownOpen ? 0 : -1}
                      title={board.name}
                    >
                      {" "}
                      {board.name}{" "}
                    </span>{" "}
                  </div>
                ))}{" "}
              </Slider>
            ) : (
              <span className="board-slide-item disabled ms-3 font-secondary">
                Nessuna lavagna.
              </span>
            )}
          </div>
          <div className="sub-header-bottom">
            <div className="controls-row">
              <div className="background-selector">
                <label
                  htmlFor={`group-bg-choice-${boardId || "default"}`}
                  className="font-primary"
                >
                  {" "}
                  Mio Sfondo:{" "}
                </label>
                <select
                  id={`group-bg-choice-${boardId || "default"}`}
                  className="font-secondary"
                  value={selectedBackgroundUI}
                  onChange={(e) => handleSaveBackground(e.target.value)}
                  disabled={
                    !canChangePersonalBackground() ||
                    groupLoading ||
                    !currentBoardData
                  }
                  title={
                    canChangePersonalBackground()
                      ? "Seleziona sfondo personale"
                      : "N/D"
                  }
                >
                  <option value="blackboard.jpg">Blackboard</option>
                  <option value="frettolosa.jpg">Frettolosa</option>
                  <option value="gesso.jpg">Gesso</option>
                  <option value="thun.jpg">Thun</option>
                  <option value="lavata.jpg">Lavata</option>
                  <option value="nera.jpg">Nera</option>
                  <option value="graffiata.jpg">Graffiata</option>
                  <option value="verde.jpg">Verde</option>
                  <option value="default-background.jpg">Default Chiaro</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modali (invariate) */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
        <Modal.Header closeButton>
          {" "}
          <Modal.Title className="font-primary text-accent">
            Aggiungi Lavagna
          </Modal.Title>{" "}
        </Modal.Header>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddBoard();
          }}
        >
          <Modal.Body>
            {" "}
            <Form.Group controlId="addBoardGroupName">
              {" "}
              <Form.Label className="font-secondary">Nome</Form.Label>{" "}
              <Form.Control
                type="text"
                className="font-secondary"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                autoFocus
                required
                placeholder="Nome..."
              />{" "}
              <Form.Control.Feedback type="invalid">
                Obbligatorio.
              </Form.Control.Feedback>{" "}
            </Form.Group>{" "}
          </Modal.Body>
          <Modal.Footer>
            {" "}
            <Button
              variant="secondary"
              className="font-secondary"
              onClick={handleCloseAddModal}
            >
              Annulla
            </Button>{" "}
            <Button
              variant="primary"
              className="font-secondary"
              type="submit"
              disabled={!newBoardName.trim()}
            >
              Aggiungi
            </Button>{" "}
          </Modal.Footer>
        </Form>
      </Modal>
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
        <Modal.Header closeButton>
          {" "}
          <Modal.Title className="font-primary text-accent">
            Modifica Nome
          </Modal.Title>{" "}
        </Modal.Header>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateBoardName();
          }}
        >
          <Modal.Body>
            {" "}
            <Form.Group controlId="editBoardGroupName">
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
              />{" "}
              <Form.Control.Feedback type="invalid">
                Obbligatorio.
              </Form.Control.Feedback>{" "}
            </Form.Group>{" "}
          </Modal.Body>
          <Modal.Footer>
            {" "}
            <Button
              variant="secondary"
              className="font-secondary"
              onClick={handleCloseEditModal}
            >
              Annulla
            </Button>{" "}
            <Button
              variant="primary"
              className="font-secondary"
              type="submit"
              disabled={
                !editedBoardName.trim() ||
                editedBoardName.trim() === currentBoardData?.name
              }
            >
              Salva
            </Button>{" "}
          </Modal.Footer>
        </Form>
      </Modal>
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          {" "}
          <Modal.Title className="font-primary text-danger">
            Conferma Eliminazione
          </Modal.Title>{" "}
        </Modal.Header>
        <Modal.Body className="font-secondary">
          {" "}
          Eliminare "
          <strong className="font-secondary">{boardToDelete?.name}</strong>"?
          (Irreversibile){" "}
        </Modal.Body>
        <Modal.Footer>
          {" "}
          <Button
            variant="secondary"
            className="font-secondary"
            onClick={handleCloseDeleteModal}
          >
            Annulla
          </Button>{" "}
          <Button
            variant="danger"
            className="font-secondary"
            onClick={confirmDeleteBoard}
          >
            Elimina
          </Button>{" "}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default GroupHeader;
