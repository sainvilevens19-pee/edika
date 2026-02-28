import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN_ECOLE' | 'PROFESSEUR' | 'PARENT';
}

interface EtatAuth {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  connexion: (email: string, motDePasse: string, ecoleId?: string) => Promise<any>;
  deconnexion: () => Promise<void>;
}

export function useAuth(): EtatAuth {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    try {
      const donnees = localStorage.getItem('utilisateur');
      if (donnees) {
        setUtilisateur(JSON.parse(donnees));
      }
    } catch {
      localStorage.clear();
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

    if (data.choix_ecole_requis) {
      return data;
    }

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('token_rafraichissement', data.token_rafraichissement);
    localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur));

    if (data.ecole_courante) {
      localStorage.setItem('ecole_courante', JSON.stringify(data.ecole_courante));
    }

    setUtilisateur(data.utilisateur);
    return data;
  }, []);

  const deconnexion = useCallback(async () => {
    try {
      await authService.deconnexion();
    } finally {
      localStorage.clear();
      setUtilisateur(null);
    }
  }, []);

  return { utilisateur, chargement, connexion, deconnexion };
}