export default function TableauDeBordAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800">Administration</h1>
        <p className="text-gray-500 mt-1">Gestion de votre établissement</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {["Élèves", "Professeurs", "Classes"].map(item => (
            <div key={item} className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-700">{item}</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">—</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}