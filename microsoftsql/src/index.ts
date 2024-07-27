import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import * as sql from 'mssql'

type IntegrationLogger = bp.Client['client']['logger']
type IntegrationCtx = bp.Client['client']['ctx']

let sqlPool: sql.ConnectionPool | null = null;

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
   
  try {
     sqlPool = await getOrCreatePool(ctx, logger)
  } catch (err: any) {
    logger.forBot().error(`Failed to connect to Microsoft SQL Server: ${err}`)
    throw new sdk.RuntimeError(`Failed to connect to Microsoft SQL Server, ${err}`)
  }

  },
  unregister: async () => {
  },
  actions: {
    createTable: async (args): Promise<{}> => {
        args.logger.forBot().info(`Received request to create table with data: ${args.input.table}`)

        // Parse the input JSON to get table schema
        let tableSchema;
        try {
        tableSchema = JSON.parse(args.input.table);
        } catch (error) {
        args.logger.forBot().error(`Error. Table is not formatted correctly. Must be a stringified JSON`)
        throw new sdk.RuntimeError('Error. Table is not formatted correctly. Must be a stringified JSON')
        }

        const { tableName, columns } = tableSchema;

        args.logger.forBot().info(`Creating table ${tableName} with columns: ${columns}`)

        // Construct the SQL statement to create a table
        let createTableSQL = `CREATE TABLE ${tableName} (`
        const columnDefinitions = columns.map((column: any) => {
            return `${column.name} ${column.type}${column.size ? `(${column.size})` : ''} ${column.required ? 'NOT NULL' : 'NULL'}`
        });
        createTableSQL += columnDefinitions.join(', ') + ');'

        args.logger.forBot().info(`Constructed SQL: ${createTableSQL}`)

        // Connect to the database and execute the SQL statement
        try {
            const pool = await getOrCreatePool(args.ctx, args.logger);
            const dbResponse = await pool.request().query(createTableSQL);
            args.logger.forBot().info(`Table ${tableName} created successfully.`);
        } catch (error: any) {
            args.logger.forBot().error(`Error creating table: ${error}`);
            throw new Error(`Failed to create table ${tableName}: ${error.message}`);
        }

        return {};
    }
  },
  channels: {},
  handler: async () => {},
})

async function getOrCreatePool(ctx: IntegrationCtx, logger: IntegrationLogger) {
    if (!sqlPool) {
      const user = ctx.configuration.user
      const password = ctx.configuration.password
      const instanceName = ctx.configuration.instanceName
      const database = ctx.configuration.database
      const port = ctx.configuration.port

      const config = {
        user: user,
        password: password,
        server: instanceName,
        database: database,
        pool: {
          idleTimeoutMillis: 30000
        },
        options: {  
          port: port,
          encrypt: false,
          trustServerCertificate: true,
        }
      }

      try {
        sqlPool = new sql.ConnectionPool(config)
        await sqlPool.connect()
        logger.forBot().info('Successfully connected and created a new SQL Server connection pool.')
      } catch (err) {
        logger.forBot().error(`Failed to create a new SQL connection pool: ${err}`)
        throw new sdk.RuntimeError(`Failed to create a new SQL connection pool, ${err}`)
      }
    }
    return sqlPool;
  }
  