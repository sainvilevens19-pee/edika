import axios from 'axios';

// ─────────────────────────────────────────
// Configuration Axios
// ─────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_URL_API || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Injecter le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gérer l'expiration du token — rafraîchir automatiquement
api.interceptors.response.use(
  (response) => response,
  async (erreur) => {
    const requeteOriginale = erreur.config;

    // Si 401 et pas déjà en train de rafraîchir
    if (erreur.response?.status === 401 && !requeteOriginale._rafraichissement) {
      requeteOriginale._rafraichissement = true;

      const tokenRafraich = localStorage.getItem('token_rafraichissement');
      if (!tokenRafraich) {
        // Pas de token de rafraîchissement → déconnexion
        localStorage.clear();
        window.location.href = '/';
        return Promise.reject(erreur);
      }

      try {
        const reponse = await api.post('/auth/rafraichir', {
          token_rafraichissement: tokenRafraich,
        });

        const { access_token, token_rafraichissement } = reponse.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('token_rafraichissement', token_rafraichissement);

        // Relancer la requête originale avec le nouveau token
        requeteOriginale.headers.Authorization = `Bearer ${access_token}`;
        return api(requeteOriginale);

      } catch {
        localStorage.clear();
        window.location.href = '/';
        return Promise.reject(erreur);
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

  deconnexion: () => {
    const token = localStorage.getItem('token_rafraichissement');
    return api.post('/auth/deconnexion', { token_rafraichissement: token });
  },
};

// ─────────────────────────────────────────
// Services Écoles
// ─────────────────────────────────────────
export const ecolesService = {
  obtenirParSlug: (slug: string) =>
    api.get(`/ecoles/connexion/${slug}`),

  verifierSlug: (slug: string) =>
    api.get(`/ecoles/verifier-slug?slug=${slug}`),

  inscrireEcole: (donnees: any) =>
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

  inscrire: (donnees: any) =>
    api.post('/eleves', donnees),

  modifier: (id: string, donnees: any) =>
    api.patch(`/eleves/${id}`, donnees),
};

// ─────────────────────────────────────────
// Services Classes
// ─────────────────────────────────────────
export const classesService = {
  lister: () => api.get('/classes'),
  creer: (donnees: any) => api.post('/classes', donnees),
  modifier: (id: string, donnees: any) => api.patch(`/classes/${id}`, donnees),
};

// ─────────────────────────────────────────
// Services Matières
// ─────────────────────────────────────────
export const matieresService = {
  lister: () => api.get('/matieres'),
  creer: (donnees: any) => api.post('/matieres', donnees),
  modifier: (id: string, donnees: any) => api.patch(`/matieres/${id}`, donnees),
};

// ─────────────────────────────────────────
// Services Affectations
// ─────────────────────────────────────────
export const affectationsService = {
  lister: () => api.get('/affectations'),
  creer: (donnees: any) => api.post('/affectations', donnees),
  supprimer: (id: string) => api.delete(`/affectations/${id}`),
};

export default api;
