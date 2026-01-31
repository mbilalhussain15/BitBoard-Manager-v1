import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, useState } from "react";

function ScrollbarRepaint() {
  const { theme, systemTheme } = useTheme();
  const [activeTheme, setActiveTheme] = useState("light");

  // Track current effective theme (light/dark)
  useEffect(() => {
    setActiveTheme(theme === "system" ? systemTheme : theme);
  }, [theme, systemTheme]);

  // Force repaint when effective theme changes
  useEffect(() => {
    if (!activeTheme) return;
    document.documentElement.style.display = "none";
    void document.body.offsetHeight; // trigger reflow
    document.documentElement.style.display = "";
  }, [activeTheme]);

  return null;
}

export default function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ScrollbarRepaint />
      {children}
    </NextThemesProvider>
  );
}















// import { ThemeProvider as NextThemesProvider } from "next-themes";

// export default function ThemeProvider({ children }) {
  
//   return (
//     <NextThemesProvider
//       attribute="class"      // <html class="dark"> toggle
//       defaultTheme="dark"    // tumhari old setting jaisi
//       enableSystem           // "system" bhi allow
//       disableTransitionOnChange
//     >
//       {children}
//     </NextThemesProvider>
//   );
// }
