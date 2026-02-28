import { Routes, Route, Navigate } from 'react-router-dom';
import ConnexionPage from './pages/ConnexionPage';
import AccueilPage from './pages/AccueilPage';
import InscriptionEcolePage from './pages/InscriptionEcolePage';
import SuperAdminPage from './pages/SuperAdminPage';
import TableauDeBordAdminPage from './pages/TableauDeBordAdminPage';
import TableauDeBordProfesseurPage from './pages/TableauDeBordProfesseurPage';
import TableauDeBordParentPage from './pages/TableauDeBordParentPage';

function obtenirUtilisateur() {
  try {
    const donnees = localStorage.getItem('utilisateur');
    return donnees ? JSON.parse(donnees) : null;
  } catch {
    return null;
  }
}

function RouteProtegee({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const utilisateur = obtenirUtilisateur();

  if (!utilisateur) {
    return <Navigate to="/connexion" replace />;
  }

  if (roles && !roles.includes(utilisateur.role)) {
    return <Navigate to="/connexion" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AccueilPage />} />
      <Route path="/connexion" element={<ConnexionPage />} />
      <Route path="/connexion/:slug" element={<ConnexionPage />} />
      <Route path="/inscription-ecole" element={<InscriptionEcolePage />} />

      <Route
        path="/super-admin"
        element={
          <RouteProtegee roles={['SUPER_ADMIN']}>
            <SuperAdminPage />
          </RouteProtegee>
        }
      />
      <Route
        path="/admin"
        element={
          <RouteProtegee roles={['ADMIN_ECOLE']}>
            <TableauDeBordAdminPage />
          </RouteProtegee>
        }
      />
      <Route
        path="/professeur"
        element={
          <RouteProtegee roles={['PROFESSEUR']}>
            <TableauDeBordProfesseurPage />
          </RouteProtegee>
        }
      />
      <Route
        path="/parent"
        element={
          <RouteProtegee roles={['PARENT']}>
            <TableauDeBordParentPage />
          </RouteProtegee>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}