// src/components/InstallPrompt/InstallPrompt.jsx
import React, { useState, useEffect } from "react";
import { Alert, Button } from "react-bootstrap";
import "./InstallPrompt.css"; // Assicurati che questo file esista

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState("");
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);

  useEffect(() => {
    // Verifica iniziale se l'app è già standalone
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      console.log("InstallPrompt: Già in modalità standalone all'avvio.");
      setAlreadyInstalled(true);
      return; // Non fare altro se già installata
    }

    // Rileva la piattaforma (semplificato)
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (
      window.navigator.standalone === true ||
      /iphone|ipad|ipod/.test(userAgent)
    ) {
      // Nota: navigator.standalone è specifico per iOS PWA
      setPlatform("ios");
    } else if (/android/.test(userAgent)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Listener per l'evento di installazione (Android/Desktop Chrome)
    const handleBeforeInstallPrompt = (e) => {
      console.log("InstallPrompt: beforeinstallprompt catturato");
      // Impedisce al mini-infobar di Chrome di apparire
      e.preventDefault();
      // Salva l'evento per poterlo triggerare dopo
      setDeferredPrompt(e);
      // Mostra il nostro prompt personalizzato (solo se non già installata)
      if (
        !window.matchMedia("(display-mode: standalone)").matches &&
        window.navigator.standalone !== true
      ) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Mostra istruzioni iOS se non è installata e non c'è prompt Android/Desktop
    // (Decidi tu se mostrarlo sempre o solo al primo avvio usando localStorage)
    if (!alreadyInstalled && /iphone|ipad|ipod/.test(userAgent)) {
      // Verifica se l'utente l'ha già chiuso in passato
      // if (!localStorage.getItem('hideInstallPromptIOS')) {
      setShowPrompt(true);
      // }
    }

    // Cleanup listener quando il componente viene smontato
    return () => {
      console.log("InstallPrompt: Cleanup listener");
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [alreadyInstalled]); // Riesegui se cambia lo stato di installazione

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    setShowPrompt(false); // Nascondi subito il nostro prompt
    // Mostra il prompt di installazione nativo
    deferredPrompt.prompt();
    // Attendi la scelta dell'utente
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`InstallPrompt: Scelta utente: ${outcome}`);
    // Resetta il prompt, può essere usato solo una volta
    setDeferredPrompt(null);
  };

  const handleClosePrompt = () => {
    setShowPrompt(false);
    // Su iOS, potresti voler salvare per non mostrarlo più
    if (platform === "ios") {
      // localStorage.setItem('hideInstallPromptIOS', 'true');
    }
    console.log("InstallPrompt: Prompt chiuso dall'utente.");
  };

  // Non mostrare nulla se non dobbiamo o se già installata
  if (alreadyInstalled || !showPrompt) {
    return null;
  }

  // Log per debug
  console.log(
    `InstallPrompt: Rendering prompt per piattaforma: ${platform}, deferredPrompt: ${!!deferredPrompt}`
  );

  return (
    <Alert
      variant="info"
      className="install-prompt-alert mt-4"
      onClose={handleClosePrompt}
      dismissible
    >
      <Alert.Heading bsPrefix="install-prompt-heading">
        {platform === "ios" ? "Aggiungi alla Home!" : "Installa l'App!"}
      </Alert.Heading>
      {platform === "android" && deferredPrompt && (
        <>
          <p>
            Aggiungi questa app alla tua schermata Home per un accesso più
            rapido e un'esperienza migliore.
          </p>
          <Button variant="primary" onClick={handleInstallClick} size="sm">
            <i className="bi bi-download me-2"></i> Installa App
          </Button>
        </>
      )}
      {platform === "ios" && (
        // Istruzioni specifiche per iOS
        <p style={{ fontSize: "var(--fs-sm)", lineHeight: "1.5" }}>
          Per installare: tocca l'icona{" "}
          <i className="bi bi-box-arrow-up" style={{ fontSize: "1.1em" }}></i>{" "}
          (Condividi) in basso nel browser, scorri verso il basso e scegli{" "}
          <span style={{ fontWeight: "bold" }}>
            {" "}
            "Aggiungi alla schermata Home"{" "}
          </span>
          <i className="bi bi-plus-square" style={{ fontSize: "1.1em" }}></i>.
        </p>
      )}
      {platform === "desktop" && deferredPrompt && (
        <>
          <p>Installa questa app sul tuo computer per un accesso più rapido.</p>
          <Button variant="primary" onClick={handleInstallClick} size="sm">
            <i className="bi bi-download me-2"></i> Installa App
          </Button>
        </>
      )}
      {platform === "desktop" && !deferredPrompt && (
        // Questo caso è meno probabile se l'evento non viene catturato,
        // ma potrebbe servire se il browser non supporta l'evento
        <p style={{ fontSize: "var(--fs-sm)" }}>
          Puoi aggiungere questa app ai preferiti o cercare l'icona di
          installazione{" "}
          <i className="bi bi-pc-display" style={{ fontSize: "1.1em" }}></i>{" "}
          nella barra degli indirizzi.
        </p>
      )}
      {/* Il bottone dismissible di react-bootstrap gestisce la chiusura */}
    </Alert>
  );
};

export default InstallPrompt;
