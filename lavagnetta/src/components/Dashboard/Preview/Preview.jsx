/* ==== src/components/Dashboard/Preview/Preview.jsx (v6 - Fix Import Button) ==== */
import React, { useState, useEffect, useCallback } from "react";
import Slider from "react-slick";
import { FaChevronDown } from "react-icons/fa";
import api from "../../../services/api";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../../LoadingSpinner/LoadingSpinner";
import { Button } from "react-bootstrap"; // <-- IMPORT AGGIUNTO

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Preview.css";

const DEFAULT_PREVIEW_BACKGROUND = "blackboard.jpg";

const Preview = () => {
  // ... (resto del codice invariato rispetto alla versione v5 precedente) ...
  const [personalBoards, setPersonalBoards] = useState([]);
  const [groupsData, setGroupsData] = useState([]);
  const [loadingPersonal, setLoadingPersonal] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    console.log("[Preview] Fetching data...");
    setLoadingPersonal(true);
    setLoadingGroups(true);
    setError(null);
    try {
      const [personalResponse, groupsResponse] = await Promise.allSettled([
        api.get("/auth/boards/personal"),
        api.get("/auth/groups"),
      ]);

      if (personalResponse.status === "fulfilled") {
        setPersonalBoards(personalResponse.value.data || []);
        console.log(
          "[Preview] Personal boards fetched:",
          personalResponse.value.data?.length ?? 0
        );
      } else {
        console.error(
          "[Preview] Error fetching personal boards:",
          personalResponse.reason
        );
        if (personalResponse.reason?.response?.status !== 401) {
          setError((prev) =>
            prev
              ? `${prev} Errore lavagne personali.`
              : "Errore caricamento lavagne personali."
          );
        }
        setPersonalBoards([]);
      }
      setLoadingPersonal(false);

      if (groupsResponse.status === "fulfilled") {
        const userGroups = groupsResponse.value.data || [];
        console.log("[Preview] Groups fetched:", userGroups.length);
        if (userGroups.length > 0) {
          const groupBoardPromises = userGroups.map(async (group) => {
            try {
              const boardsResponse = await api.get(
                `/auth/groups/${group.id}/boards`
              );
              const boardsWithProcessedProducts = (
                boardsResponse.data || []
              ).map((b) => ({
                ...b,
                userBackground:
                  b.userBackground !== undefined ? b.userBackground : null,
                products: (b.products || []).map((p) => ({
                  ...p,
                  is_purchased: !!p.is_purchased,
                })),
              }));
              boardsWithProcessedProducts.sort((a, b) => {
                if (a.is_group_default && !b.is_group_default) return -1;
                if (!a.is_group_default && b.is_group_default) return 1;
                return (a.name || "").localeCompare(b.name || "");
              });
              return { ...group, boards: boardsWithProcessedProducts };
            } catch (groupError) {
              console.error(
                `[Preview] Error fetching boards for group ${group.id}:`,
                groupError
              );
              return { ...group, boards: [], error: true };
            }
          });
          const resolvedGroupsData = await Promise.all(groupBoardPromises);
          setGroupsData(resolvedGroupsData.filter((g) => !g.error));
          console.log("[Preview] Group boards processed.");
        } else {
          setGroupsData([]);
        }
      } else {
        console.error(
          "[Preview] Error fetching groups:",
          groupsResponse.reason
        );
        if (groupsResponse.reason?.response?.status !== 401) {
          setError((prev) =>
            prev ? `${prev} Errore gruppi.` : "Errore caricamento gruppi."
          );
        }
        setGroupsData([]);
      }
      setLoadingGroups(false);
    } catch (err) {
      console.error("[Preview] Unexpected error during fetch:", err);
      setError("Errore imprevisto nel caricamento delle anteprime.");
      setPersonalBoards([]);
      setGroupsData([]);
      setLoadingPersonal(false);
      setLoadingGroups(false);
    }
    console.log("[Preview] Fetch data complete.");
  }, []);

  useEffect(() => {
    if (location.pathname === "/dashboard") {
      fetchData();
    }
  }, [location.pathname, fetchData]);

  const handleBoardClick = (board, groupId = null) => {
    if (!board || !board.id) {
      toast.error("ID lavagna non valido.");
      return;
    }
    localStorage.removeItem("selectedBoard");
    if (groupId === null) {
      navigate("/board", { state: { selectedId: board.id } });
    } else {
      navigate(`/groups/${groupId}/boards/${board.id}`);
    }
  };

  const handleBoardDetailsClick = (e, board, groupInfo) => {
    e.stopPropagation();
    const boardType = groupInfo ? `(Gruppo: ${groupInfo.name})` : "(Personale)";
    toast.info(
      `Dettagli per "${board.name}" ${boardType} - Azione da implementare.`,
      { autoClose: 2500 }
    );
  };

  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: 4.5,
    slidesToScroll: 3,
    variableWidth: false,
    swipeToSlide: true,
    arrows: true,
    responsive: [
      { breakpoint: 1600, settings: { slidesToShow: 4.5, slidesToScroll: 3 } },
      { breakpoint: 1400, settings: { slidesToShow: 3.5, slidesToScroll: 2 } },
      { breakpoint: 1200, settings: { slidesToShow: 3.2, slidesToScroll: 2 } },
      { breakpoint: 992, settings: { slidesToShow: 2.5, slidesToScroll: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1.8, slidesToScroll: 1 } },
      { breakpoint: 576, settings: { slidesToShow: 1.3, slidesToScroll: 1 } },
    ],
  };

  const renderBoardCard = (board, groupInfo = null) => {
    const boardKey = groupInfo
      ? `group-${groupInfo.id}-board-${board.id}`
      : `personal-board-${board.id}`;
    const backgroundToShow =
      board.userBackground || board.background || DEFAULT_PREVIEW_BACKGROUND;
    const backgroundUrl = `/images/${backgroundToShow}`;
    const productsToShow = Array.isArray(board.products) ? board.products : [];
    const visibleProducts = productsToShow;
    const isDefault = groupInfo ? !!board.is_group_default : !!board.is_default;

    return (
      <div key={boardKey} className="card-slide-wrapper">
        <div
          className="board-card-preview"
          role="button"
          tabIndex={0}
          onClick={() => handleBoardClick(board, groupInfo?.id)}
          onKeyPress={(e) => {
            if (e.key === "Enter") handleBoardClick(board, groupInfo?.id);
          }}
          title={`Apri lavagna ${board.name}${groupInfo ? ` (Gruppo ${groupInfo.name})` : ""}`}
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        >
          <div className="board-card-preview__content">
            <div className="board-card-preview__header">
              <h5
                className="board-card-preview__title font-primary text-shadow-chalk"
                title={board.name}
              >
                {board.name}
                {isDefault && (
                  <span className="board-card-preview__default-tag">
                    (Default)
                  </span>
                )}
              </h5>
            </div>
            <div className="board-card-preview__products">
              {visibleProducts.length > 0 ? (
                <ul className="product-list-scrollable">
                  {visibleProducts.map((product, index) => (
                    <li
                      key={product.id || `${boardKey}-prod-${index}`}
                      className={`product-item font-secondary ${product.is_purchased ? "purchased" : ""}`}
                      title={product.name}
                    >
                      {product.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="no-products-text font-secondary">
                  Lavagna vuota
                </span>
              )}
            </div>
            <button
              className="board-card-preview__details-btn"
              onClick={(e) => handleBoardDetailsClick(e, board, groupInfo)}
              aria-label={`Dettagli per ${board.name}`}
              title="Mostra dettagli"
            >
              <FaChevronDown />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const isLoading = loadingPersonal || loadingGroups;
  if (isLoading) {
    return (
      <div className="preview-container preview-loading text-center py-5">
        <LoadingSpinner />
        <p className="mt-3 font-secondary text-muted">
          Caricamento anteprime...
        </p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="preview-container preview-error alert alert-danger mx-3 font-secondary">
        {error}
        {/* Aggiunto Bottone Riprova */}
        <Button
          variant="outline-secondary"
          size="sm"
          className="ms-2"
          onClick={() => fetchData()}
        >
          Riprova
        </Button>
      </div>
    );
  }
  const groupsWithBoards = groupsData.filter(
    (g) => Array.isArray(g.boards) && g.boards.length > 0
  );
  if (personalBoards.length === 0 && groupsWithBoards.length === 0) {
    return (
      <div className="preview-container preview-empty text-center py-5">
        <p className="lead font-secondary text-muted">
          Nessuna lavagnetta trovata. Inizia creandone una personale!
        </p>
      </div>
    );
  }

  return (
    <div className="preview-container">
      {personalBoards.length > 0 && (
        <div className="preview-row">
          <h3 className="preview-row-title font-primary text-shadow-chalk">
            Le Tue Lavagne
          </h3>
          <Slider {...sliderSettings}>
            {personalBoards.map((board) => renderBoardCard(board))}
          </Slider>
        </div>
      )}
      {groupsWithBoards.map((group) => (
        <div key={`group-row-${group.id}`} className="preview-row">
          <div className="preview-row-header d-flex justify-content-between align-items-center mb-2 px-md-1">
            <h3 className="preview-row-title font-primary text-shadow-chalk mb-0">
              Gruppo: {group.name}
            </h3>
            {group.role && (
              <span className="badge bg-secondary font-secondary">
                Ruolo: {group.role}
              </span>
            )}
          </div>
          <Slider {...sliderSettings}>
            {group.boards.map((board) =>
              renderBoardCard(board, { id: group.id, name: group.name })
            )}
          </Slider>
        </div>
      ))}
    </div>
  );
};

export default Preview;
///super
