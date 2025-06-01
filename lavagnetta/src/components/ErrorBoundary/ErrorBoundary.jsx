// src/components/ErrorBoundary/ErrorBoundary.jsx

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Aggiorna lo stato per mostrare l'interfaccia di fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Puoi registrare l'errore in un servizio di log
    console.error("Errore catturato da ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Puoi renderizzare qualsiasi interfaccia di fallback
      return <h1>Qualcosa è andato storto.</h1>;
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
