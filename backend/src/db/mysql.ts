import mysql from 'mysql2/promise';

export interface MySqlConfig {
  host: string;
  user: string;
  password?: string;
  database: string;
  port?: number;
}

export function createMySqlPool(config?: Partial<MySqlConfig>) {
  const host = config?.host || process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost';
  const user = config?.user || process.env.MYSQL_USER || process.env.DB_USER || 'root';
  const password = config?.password || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || process.env.DB_PASS || '';
  const database = config?.database || process.env.MYSQL_DATABASE || process.env.DB_NAME || '';
  const port = Number(config?.port || process.env.MYSQL_PORT || process.env.DB_PORT || 3306);

  if (!database) {
    return null;
  }

  const pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
  });

  return pool;
}
