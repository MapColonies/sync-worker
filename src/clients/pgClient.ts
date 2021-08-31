import { Pool, PoolConfig, QueryResult } from 'pg';
import { inject, singleton } from 'tsyringe';
import { Services } from '../common/constants';
import { IDBConfig } from '../common/interfaces';

@singleton()
export class PgClient {
  private readonly pool: Pool;
  private readonly pgConfig: PoolConfig;

  public constructor(@inject(Services.DB_CONFIG) private readonly dbConfig: IDBConfig) {
    this.pgConfig = {
      host: this.dbConfig.host,
      user: this.dbConfig.user,
      database: this.dbConfig.database,
      password: this.dbConfig.password,
      port: this.dbConfig.port,
    };
    this.pool = new Pool(this.pgConfig);
  }

  public async execute(query: string): Promise<QueryResult> {
    const client = await this.pool.connect();
    const queryResult = await client.query<Promise<QueryResult>>(query);
    console.log(queryResult);

    return queryResult;
  }
}
