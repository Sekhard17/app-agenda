import { createContext } from 'react';

// Definir la interfaz para el contexto del tema
interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
}

// Crear el contexto con un valor predeterminado
export const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});
