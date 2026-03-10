import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/utiliserAuthentification';
import { ecolesService } from '../services/api';

export default function ConnexionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { connexion } = useAuth();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [message, setMessage] = useState('');
  const [ecole, setEcole] = useState<{ id: string; nom: string } | null>(null);

  // Charger les infos de l'école si slug présent dans l'URL
  // Utilise le service axios (proxy Vite) au lieu de fetch avec URL en dur
  useEffect(() => {
    if (slug) {
      ecolesService.obtenirParSlug(slug)
        .then((r) => {
          if (r.data?.id) setEcole(r.data);
          else setMessage('École introuvable');
        })
        .catch(() => setMessage('Erreur de connexion au serveur'));
    }
  }, [slug]);

  const gererClic = async () => {
    if (!email || !motDePasse) {
      setMessage('Veuillez remplir tous les champs');
      return;
    }
    setMessage('Connexion en cours...');
    try {
      const resultat = await connexion(email, motDePasse, ecole?.id) as any;
      const role = resultat?.utilisateur?.role;
      if (role === 'SUPER_ADMIN') window.location.href = '/super-admin';
      else if (role === 'ADMIN_ECOLE') window.location.href = '/admin';
      else if (role === 'SECRETAIRE') window.location.href = '/admin';
      else if (role === 'PROFESSEUR') window.location.href = '/professeur';
      else if (role === 'PARENT') window.location.href = '/parent';
      else if (role === 'ELEVE') window.location.href = '/eleve';
      else setMessage('Rôle non reconnu : ' + role);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Identifiants incorrects');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-3 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {ecole ? ecole.nom[0].toUpperCase() : 'S'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {ecole ? ecole.nom : 'Système Scolaire'}
          </h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div className={`text-sm rounded-xl p-3 ${
              message === 'Connexion en cours...'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={gererClic}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Se connecter
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <a href="/inscription-ecole" className="text-blue-600 hover:underline">
            Inscrire mon école
          </a>
        </p>
      </div>
    </div>
  );
}
