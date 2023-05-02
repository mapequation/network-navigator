import React from "react";

export default function MapEquationBibTeX({
  currentYear = new Date().getFullYear()
}) {
  const bibtex = `@misc{mapequation${currentYear}software,
    title = {{The MapEquation software package}},
    author = {Edler, Daniel and Holmgren, Anton and Rosvall, Martin},
    howpublished = {\\url{https://mapequation.org}},
    year = ${currentYear},
}`;

  return <>{bibtex}</>;
}
