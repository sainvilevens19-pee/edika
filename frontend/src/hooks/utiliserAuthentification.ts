import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN_ECOLE' | 'SECRETAIRE' | 'PROFESSEUR' | 'PARENT' | 'ELEVE';
}

interface EcoleInfo {
  id: string;
  schema: string;
}

interface EtatAuth {
  utilisateur: Utilisateur | null;
  ecoleCourante: EcoleInfo | null;
  chargement: boolean;
  connexion: (email: string, motDePasse: string, ecoleId?: string) => Promise<unknown>;
  deconnexion: () => Promise<void>;
}

/**
 * useAuth — gestion de l'état d'authentification.
 *
 * Les tokens (access_token, refresh_token) sont stockés exclusivement
 * dans des cookies httpOnly gérés par le backend.
 * Seules les données NON sensibles (profil utilisateur, école courante)
 * sont conservées dans localStorage pour l'affichage de l'UI.
 */
export function useAuth(): EtatAuth {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [ecoleCourante, setEcoleCourante] = useState<EcoleInfo | null>(null);
  const [chargement, setChargement] = useState(true);

  // Charger les données UI depuis localStorage au montage
  useEffect(() => {
    try {
      const donneesUser = localStorage.getItem('utilisateur');
      const donneesEcole = localStorage.getItem('ecole_courante');

      if (donneesUser) setUtilisateur(JSON.parse(donneesUser));
      if (donneesEcole) setEcoleCourante(JSON.parse(donneesEcole));
    } catch {
      // Données corrompues → nettoyage ciblé (pas localStorage.clear() entier)
      localStorage.removeItem('utilisateur');
      localStorage.removeItem('ecole_courante');
    } finally {
      setChargement(false);
    }
  }, []);

  const connexion = useCallback(async (
    email: string,
    motDePasse: string,
    ecoleId?: string,
  ) => {
    const reponse = await authService.connexion(email, motDePasse, ecoleId);
    const data = reponse.data;

    // Cas professeur multi-écoles : retourner la liste sans stocker quoi que ce soit
    if (data.choix_ecole_requis) {
      return data;
    }

    // Stocker uniquement les données UI (non sensibles) — les tokens sont dans les cookies httpOnly
    localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur));
    if (data.ecole_courante) {
      localStorage.setItem('ecole_courante', JSON.stringify(data.ecole_courante));
    }

    setUtilisateur(data.utilisateur);
    setEcoleCourante(data.ecole_courante ?? null);

    return data;
  }, []);

  const deconnexion = useCallback(async () => {
    try {
      // Le backend révoque le refresh token en DB et supprime les cookies httpOnly
      await authService.deconnexion();
    } finally {
      // Nettoyer uniquement les données UI locales
      localStorage.removeItem('utilisateur');
      localStorage.removeItem('ecole_courante');
      setUtilisateur(null);
      setEcoleCourante(null);
    }
  }, []);

  return { utilisateur, ecoleCourante, chargement, connexion, deconnexion };
}
