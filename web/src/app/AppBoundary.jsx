import React from 'react';

export class AppBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  } static getDerivedStateFromError(error) {
    return { error };
  } componentDidCatch(error) {
    console.error(error);
  } render() {
    if (this.state.error) return <main style={{ padding: 24, fontFamily: 'Arial', color: '#26384a' }}>
      <h1>Não foi possível abrir esta área</h1>
      <p>{this.state.error.message}</p>
      <button onClick={() => location.reload()}>Tentar novamente</button>
    </main>;
    return this.props.children;
  }
}
