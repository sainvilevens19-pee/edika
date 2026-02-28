const bcrypt = require('bcrypt');
const { Pool } = require('pg');
async function main() {
  const hash = await bcrypt.hash('Admin2024!', 12);
  console.log('Hash:', hash);
  const pool = new Pool({ host: 'postgres', port: 5432, database: 'systeme_scolaire', user: 'admin', password: 'Scolaire2024' });
  await pool.query('DELETE FROM utilisateurs WHERE email = ' + String.fromCharCode(36) + '1', ['admin@tonsysteme.ht']);
  await pool.query('INSERT INTO utilisateurs(id,email,mot_de_passe,role,nom,prenom,actif,cree_le,modifie_le) VALUES(gen_random_uuid(),' + String.fromCharCode(36) + '1,' + String.fromCharCode(36) + '2,' + String.fromCharCode(36) + '3,' + String.fromCharCode(36) + '4,' + String.fromCharCode(36) + '5,true,NOW(),NOW())', ['admin@tonsysteme.ht', hash, 'SUPER_ADMIN', 'Admin', 'Super']);
  console.log('SUCCES');
  await pool.end();
}
main().catch(e => { console.log('ERREUR:', e.message); process.exit(1); });