import axios from 'axios';

// ─────────────────────────────────────────
// Configuration Axios
// URL relative /api/v1 — routée par le proxy Vite en dev,
// et par le reverse-proxy (nginx/caddy) en production.
// withCredentials = true → les cookies httpOnly sont envoyés automatiquement.
// Plus besoin de gérer les tokens dans le code : le navigateur le fait.
// ─────────────────────────────────────────
const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,  // Envoi automatique des cookies httpOnly (access_token, refresh_token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────
// Intercepteur de réponse — rafraîchissement automatique du token
// Sur 401 : l'access_token en cookie est expiré.
// Le refresh_token (cookie httpOnly) est envoyé automatiquement à /auth/rafraichir.
// Le backend re-set les deux cookies et on relance la requête originale.
// ─────────────────────────────────────────
let enCoursDeRafraichissement = false;

api.interceptors.response.use(
  (response) => response,
  async (erreur) => {
    const requeteOriginale = erreur.config;

    if (erreur.response?.status === 401 && !requeteOriginale._rafraichissement) {
      requeteOriginale._rafraichissement = true;

      if (enCoursDeRafraichissement) {
        localStorage.removeItem('utilisateur');
        localStorage.removeItem('ecole_courante');
        window.location.href = '/connexion';
        return Promise.reject(erreur);
      }

      enCoursDeRafraichissement = true;

      try {
        // Le refresh token est dans le cookie httpOnly → pas de body nécessaire
        await api.post('/auth/rafraichir');

        // Les nouveaux cookies sont automatiquement set par le backend.
        // Relancer la requête originale (les nouveaux cookies seront envoyés).
        return api(requeteOriginale);

      } catch {
        // Échec du rafraîchissement → déconnexion complète
        localStorage.removeItem('utilisateur');
        localStorage.removeItem('ecole_courante');
        window.location.href = '/connexion';
        return Promise.reject(erreur);

      } finally {
        enCoursDeRafraichissement = false;
      }
    }

    return Promise.reject(erreur);
  },
);

// ─────────────────────────────────────────
// Services Auth
// ─────────────────────────────────────────
export const authService = {
  connexion: (email: string, motDePasse: string, ecoleId?: string) =>
    api.post('/auth/connexion', { email, mot_de_passe: motDePasse, ecole_id: ecoleId }),

  changerEcole: (ecoleId: string) =>
    api.post('/auth/changer-ecole', { ecole_id: ecoleId }),

  rafraichir: () =>
    api.post('/auth/rafraichir'),

  deconnexion: () =>
    api.post('/auth/deconnexion'),
};

// ─────────────────────────────────────────
// Services Écoles
// ─────────────────────────────────────────
export const ecolesService = {
  obtenirParSlug: (slug: string) =>
    api.get(`/ecoles/connexion/${slug}`),

  verifierSlug: (slug: string) =>
    api.get(`/ecoles/verifier-slug?slug=${slug}`),

  inscrireEcole: (donnees: Record<string, unknown>) =>
    api.post('/ecoles/inscription', donnees),

  listerEcoles: () =>
    api.get('/ecoles'),
};

// ─────────────────────────────────────────
// Services Élèves
// ─────────────────────────────────────────
export const elevesService = {
  lister: (filtres?: { classe_id?: string; annee_scolaire?: string }) =>
    api.get('/eleves', { params: filtres }),

  obtenir: (id: string) =>
    api.get(`/eleves/${id}`),

  inscrire: (donnees: Record<string, unknown>) =>
    api.post('/eleves', donnees),

  modifier: (id: string, donnees: Record<string, unknown>) =>
    api.patch(`/eleves/${id}`, donnees),
};

// ─────────────────────────────────────────
// Services Classes
// ─────────────────────────────────────────
export const classesService = {
  lister: () => api.get('/classes'),
  creer: (donnees: Record<string, unknown>) => api.post('/classes', donnees),
  modifier: (id: string, donnees: Record<string, unknown>) => api.patch(`/classes/${id}`, donnees),
};

// ─────────────────────────────────────────
// Services Matières
// ─────────────────────────────────────────
export const matieresService = {
  lister: () => api.get('/matieres'),
  creer: (donnees: Record<string, unknown>) => api.post('/matieres', donnees),
  modifier: (id: string, donnees: Record<string, unknown>) => api.patch(`/matieres/${id}`, donnees),
};

// ─────────────────────────────────────────
// Services Affectations
// ─────────────────────────────────────────
export const affectationsService = {
  lister: () => api.get('/affectations'),
  creer: (donnees: Record<string, unknown>) => api.post('/affectations', donnees),
  supprimer: (id: string) => api.delete(`/affectations/${id}`),
};

export default api;
