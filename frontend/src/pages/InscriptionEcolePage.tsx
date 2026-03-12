import { useState } from 'react';
import { ecolesService } from '../services/api';

export default function InscriptionEcolePage() {
  const [etape, setEtape] = useState(1);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [slugFinal, setSlugFinal] = useState('');

  const [donnees, setDonnees] = useState({
    nom: '', slug: '', ville: '', adresse: '',
    telephone: '', email: '', directeur_nom: '',
    annee_scolaire: '2024-2025',
    admin_nom: '', admin_prenom: '',
    admin_email: '', admin_mot_de_passe: '',
  });

  const mettreAJour = (champ: string, valeur: string) => {
    if (champ === 'nom') {
      const slug = valeur.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setDonnees(prev => ({ ...prev, nom: valeur, slug }));
    } else {
      setDonnees(prev => ({ ...prev, [champ]: valeur }));
    }
  };

  const inscrire = async () => {
    setChargement(true);
    setErreur('');
    try {
      await ecolesService.inscrireEcole(donnees);
      setSlugFinal(donnees.slug);
      setEtape(3);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setErreur(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erreur de connexion au serveur'));
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Inscrire mon école</h1>
          <p className="text-gray-500 text-sm mt-1">Étape {Math.min(etape, 2)} sur 2</p>
          <div className="flex gap-2 mt-3 justify-center">
            <div className={`h-2 w-16 rounded-full ${etape >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`h-2 w-16 rounded-full ${etape >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
        </div>

        {etape === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700">Informations de l'école</h2>

            {[
              { label: "Nom de l'école *", champ: 'nom', placeholder: 'ex: Collège Saint-Pierre' },
              { label: 'Ville', champ: 'ville', placeholder: 'ex: Port-au-Prince' },
              { label: 'Téléphone', champ: 'telephone', placeholder: '+509 3700-0000' },
              { label: "Email de l'école", champ: 'email', placeholder: 'ecole@exemple.com' },
              { label: 'Nom du directeur', champ: 'directeur_nom', placeholder: 'ex: Jean Pierre' },
            ].map(({ label, champ, placeholder }) => (
              <div key={champ}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="text"
                  value={(donnees as any)[champ]}
                  onChange={e => mettreAJour(champ, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant unique *</label>
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                <span className="bg-gray-50 px-3 py-3 text-gray-400 text-sm border-r border-gray-300">/connexion/</span>
                <input
                  type="text"
                  value={donnees.slug}
                  onChange={e => mettreAJour('slug', e.target.value)}
                  placeholder="saint-pierre"
                  className="flex-1 px-3 py-3 focus:outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Généré automatiquement depuis le nom.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année scolaire *</label>
              <select
                value={donnees.annee_scolaire}
                onChange={e => mettreAJour('annee_scolaire', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2023-2024">2023-2024</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            {erreur && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">{erreur}</div>}

            <button
              type="button"
              onClick={() => {
                if (!donnees.nom || !donnees.slug) { setErreur('Nom et identifiant obligatoires'); return; }
                setErreur('');
                setEtape(2);
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
            >
              Continuer →
            </button>
          </div>
        )}

        {etape === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700">Compte administrateur</h2>

            {[
              { label: 'Nom *', champ: 'admin_nom', placeholder: 'Pierre', type: 'text' },
              { label: 'Prénom *', champ: 'admin_prenom', placeholder: 'Jean', type: 'text' },
              { label: 'Email *', champ: 'admin_email', placeholder: 'admin@ecole.com', type: 'email' },
              { label: 'Mot de passe *', champ: 'admin_mot_de_passe', placeholder: 'Minimum 8 caractères', type: 'password' },
            ].map(({ label, champ, placeholder, type }) => (
              <div key={champ}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  value={(donnees as any)[champ]}
                  onChange={e => mettreAJour(champ, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            {erreur && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">{erreur}</div>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setEtape(1)}
                className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50">
                ← Retour
              </button>
              <button type="button" onClick={inscrire} disabled={chargement}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
                {chargement ? 'Inscription...' : 'Inscrire'}
              </button>
            </div>
          </div>
        )}

        {etape === 3 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
              <span className="text-green-600 text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">École inscrite !</h2>
            <div className="bg-blue-50 rounded-xl p-4 text-left">
              <p className="text-sm font-medium text-gray-700">Votre lien de connexion :</p>
              <p className="text-blue-600 font-mono text-sm mt-1">/connexion/{slugFinal}</p>
            </div>
            <a href={`/connexion/${slugFinal}`}
              className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 text-center">
              Se connecter maintenant
            </a>
          </div>
        )}

      </div>
    </div>
  );
}