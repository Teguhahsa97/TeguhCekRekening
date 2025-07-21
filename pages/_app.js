// pages/_app.js
import '../styles/globals.css'; // Import global styles Anda
import { ThemeProvider } from '../context/ThemeContext'; // Import ThemeProvider

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider> {/* Wrap seluruh aplikasi dengan ThemeProvider */}
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;