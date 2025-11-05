import '../styles/globals.css';

/**
 * Componente _app.js é necessário no Pages Router do Next.js
 * para importar estilos globais e wrapper de aplicação
 */
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

