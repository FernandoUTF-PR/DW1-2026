const { Pool } = require('pg');

// Credenciais podem ser configuradas por variáveis de ambiente sem alterar o código.
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'padaria',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
};

const pool = new Pool({ ...dbConfig, max: 10 });
pool.on('error', (err) => console.error('Erro inesperado no pool PostgreSQL:', err));

async function query(text, params = []) {
  return pool.query(text, params);
}

// Todas as consultas da transação usam a MESMA conexão.
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (rollbackError) {
      console.error('Erro ao reverter transação:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function testConnection() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Erro ao conectar com PostgreSQL:', error.message);
    return false;
  }
}

module.exports = { pool, query, transaction, testConnection };
