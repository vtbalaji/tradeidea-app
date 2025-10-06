/**
 * EOD Database Manager using DuckDB
 *
 * Manages local storage of End-of-Day OHLCV data
 * Supports incremental updates (fetch only new data)
 */

import * as duckdb from 'duckdb';
import * as path from 'path';
import * as fs from 'fs';

export interface OHLCVRow {
  symbol: string;
  date: string;  // YYYY-MM-DD format
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adj_close?: number;
}

export class EODDatabase {
  private db: duckdb.Database;
  private connection: duckdb.Connection | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'eod.duckdb');

    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Try in-memory first, fallback to file-based
    try {
      this.db = new duckdb.Database(':memory:');
      console.log('📝 Using in-memory DuckDB');
    } catch (e) {
      console.log('📁 Falling back to file-based DuckDB');
      this.db = new duckdb.Database(this.dbPath);
    }
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize(): Promise<void> {
    return Promise.race([
      new Promise<void>((resolve, reject) => {
        console.log('🔌 Connecting to DuckDB...');
        this.db.connect((err, conn) => {
          if (err) {
            console.error('❌ Connection error:', err);
            reject(err);
            return;
          }

          console.log('✅ Connected to DuckDB');
          this.connection = conn;

          // Create OHLCV table
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS ohlcv (
              symbol VARCHAR NOT NULL,
              date DATE NOT NULL,
              open DOUBLE,
              high DOUBLE,
              low DOUBLE,
              close DOUBLE,
              volume BIGINT,
              adj_close DOUBLE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (symbol, date)
            );
          `;

          console.log('📋 Creating table...');
          this.connection.run(createTableSQL, (err) => {
            if (err) {
              console.error('❌ Create table error:', err);
              reject(err);
              return;
            }

            console.log('✅ Table created');

            // Create indexes for fast queries
            const createIndexSQL = `
              CREATE INDEX IF NOT EXISTS idx_symbol_date
              ON ohlcv(symbol, date DESC);
            `;

            console.log('📇 Creating index...');
            this.connection!.run(createIndexSQL, (err) => {
              if (err) {
                console.error('❌ Create index error:', err);
                reject(err);
              } else {
                console.log('✅ Index created');
                resolve();
              }
            });
          });
        });
      }),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('DuckDB initialization timeout (10s)')), 10000)
      )
    ]);
  }

  /**
   * Get the last available date for a symbol
   */
  async getLastDate(symbol: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT MAX(date) as last_date
        FROM ohlcv
        WHERE symbol = ?
      `;

      this.connection!.all(sql, [symbol], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        if (rows.length > 0 && rows[0].last_date) {
          resolve(rows[0].last_date);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Get row count for a symbol
   */
  async getRowCount(symbol: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count
        FROM ohlcv
        WHERE symbol = ?
      `;

      this.connection!.all(sql, [symbol], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows[0]?.count || 0);
      });
    });
  }

  /**
   * Insert OHLCV data (bulk insert)
   */
  async insertBulk(data: OHLCVRow[]): Promise<void> {
    if (data.length === 0) return;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO ohlcv
        (symbol, date, open, high, low, close, volume, adj_close)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Use transaction for bulk insert
      this.connection!.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          reject(err);
          return;
        }

        let completed = 0;
        let hasError = false;

        data.forEach((row) => {
          if (hasError) return;

          this.connection!.run(
            sql,
            [
              row.symbol,
              row.date,
              row.open,
              row.high,
              row.low,
              row.close,
              row.volume,
              row.adj_close || row.close
            ],
            (err) => {
              if (err && !hasError) {
                hasError = true;
                this.connection!.run('ROLLBACK', () => {
                  reject(err);
                });
                return;
              }

              completed++;
              if (completed === data.length && !hasError) {
                this.connection!.run('COMMIT', (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                });
              }
            }
          );
        });
      });
    });
  }

  /**
   * Get OHLCV data for a symbol (sorted by date ASC)
   */
  async getOHLCV(
    symbol: string,
    limit?: number,
    startDate?: string,
    endDate?: string
  ): Promise<OHLCVRow[]> {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT symbol, date, open, high, low, close, volume, adj_close
        FROM ohlcv
        WHERE symbol = ?
      `;

      const params: any[] = [symbol];

      if (startDate) {
        sql += ` AND date >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        sql += ` AND date <= ?`;
        params.push(endDate);
      }

      sql += ` ORDER BY date ASC`;

      if (limit) {
        sql += ` LIMIT ?`;
        params.push(limit);
      }

      this.connection!.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows as OHLCVRow[]);
      });
    });
  }

  /**
   * Get all symbols in database
   */
  async getAllSymbols(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT DISTINCT symbol FROM ohlcv ORDER BY symbol`;

      this.connection!.all(sql, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows.map(r => r.symbol));
      });
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalRows: number;
    symbols: number;
    dateRange: { min: string; max: string };
    dbSizeMB: number;
  }> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          COUNT(*) as total_rows,
          COUNT(DISTINCT symbol) as symbols,
          MIN(date) as min_date,
          MAX(date) as max_date
        FROM ohlcv
      `;

      this.connection!.all(sql, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const stats = rows[0];

        // Get file size
        let dbSizeMB = 0;
        try {
          const fileStats = fs.statSync(this.dbPath);
          dbSizeMB = fileStats.size / (1024 * 1024);
        } catch (e) {
          // File doesn't exist yet
        }

        resolve({
          totalRows: stats.total_rows || 0,
          symbols: stats.symbols || 0,
          dateRange: {
            min: stats.min_date || 'N/A',
            max: stats.max_date || 'N/A'
          },
          dbSizeMB: parseFloat(dbSizeMB.toFixed(2))
        });
      });
    });
  }

  /**
   * Delete data for a symbol
   */
  async deleteSymbol(symbol: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM ohlcv WHERE symbol = ?`;

      this.connection!.run(sql, [symbol], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.connection) {
        this.connection.close(() => {
          this.db.close(() => {
            resolve();
          });
        });
      } else {
        this.db.close(() => {
          resolve();
        });
      }
    });
  }
}
