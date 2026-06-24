/**
 * DH TISSU — Image section Expérience (catalogue)
 */
(async function () {
  'use strict';

  const img = document.getElementById('experienceImage');
  const link = document.getElementById('experienceImageLink');
  if (!img) return;

  try {
    await window.DH_CATALOG_READY;
    const utils = window.DH_CATALOG;
    if (!utils) return;

    const picks = utils.pickRandomVisuals(1);
    if (!picks.length) return;

    const visual = picks[0];
    img.src = visual.src;
    img.alt = `${visual.label} — DH TISSU Casablanca`;

    if (link && visual.href) {
      link.href = visual.href;
    }
  } catch {
    /* garde l'image par défaut si le catalogue ne charge pas */
  }
})();
