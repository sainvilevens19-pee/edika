export default function AccueilPage() {
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center">
          <span className="text-white text-4xl font-bold">S</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Système de Gestion Scolaire
        </h1>
        <p className="text-gray-500 text-lg mb-8">
          La plateforme numérique pour les établissements scolaires haïtiens
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/connexion"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Se connecter
          </a>
          <a
            href="/inscription-ecole"
            className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            Inscrire mon école
          </a>
        </div>
      </div>
    </div>
  );
}