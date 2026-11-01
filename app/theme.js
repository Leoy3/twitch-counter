// Nombre con el que se guarda el modo (claro u oscuro) en el navegador de cada visitante
export const THEME_STORAGE_KEY = "theme";

// Paleta del modo oscuro: "midnight", "grape", "charcoal" u "ocean"
// (los colores de cada una están en theme-pastel.css, sección "modo oscuro")
export const DARK_PALETTE = "midnight";

// Corre antes de que se pinte la página: si el visitante eligió modo oscuro,
// lo aplica de entrada para que no se vea un parpadeo en modo claro
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;
