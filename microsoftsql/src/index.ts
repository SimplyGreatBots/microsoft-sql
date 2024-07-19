import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import * as sql from 'mssql'

type IntegrationLogger = bp.Client['client']['logger']

let pool: sql.ConnectionPool | null = null

async function getPool(config: sql.config, logger: IntegrationLogger): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool
  }
  try {
    pool = await sql.connect(config)
    logger.forBot().info('Successfully connected to Microsoft SQL Server')
  } catch (err: any) {
    logger.forBot().error(`Failed to connect to Microsoft SQL Server: ${err}`)
    throw new sdk.RuntimeError(`Failed to connect to Microsoft SQL Server, ${err}`)
  }
  return pool
}

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
   
  const user = ctx.configuration.user
  const password = ctx.configuration.password
  const server = ctx.configuration.server
  const database = ctx.configuration.database

  const config = {
    user: user,
    password: password,
    server: 'localhost',
    database: database,
    pool:{
        idleTimeoutMillis: 30000
    },
    options: {
        instanceName: server,
        encrypt: false,
        trustServerCertificate: true,
    }
  }
  
  try {
    const pool = await sql.connect(config)
    logger.forBot().info('Successfully connected to Microsoft SQL Server')

  } catch (err: any) {
    logger.forBot().error(`Failed to connect to Microsoft SQL Server: ${err}`)
    throw new sdk.RuntimeError(`Failed to connect to Microsoft SQL Server, ${err}`)
  }

  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    throw new sdk.RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  actions: {
    createTable: async (args): Promise<{}> => {
      args.logger.forBot().info(`Creating table: ${args.input.table}`)

      const { table } = args.input
      const logger = args.logger as IntegrationLogger

      const pool = await getPool({
        user: args.ctx.configuration.user,
        password: args.ctx.configuration.password,
        server: 'localhost',
        database: args.ctx.configuration.database,
        options: {
          instanceName: args.ctx.configuration.server,
          encrypt: false,
          trustServerCertificate: true,
        }
      }, logger)

      try {
        // const createTableQuery = `
        //   CREATE TABLE ${table.name} (
        //     ${table.columns.map((col: { name: string, type: string }) => `${col.name} ${col.type}`).join(', ')}
        //     )`
            
        //await pool.request().query(createTableQuery)
        logger.forBot().info(`Table created successfully`)
      } catch (err: any) {
        handleSQLError(err, logger)
        throw new sdk.RuntimeError(`Failed to create table ${err}`)
      }

      return {}
    }
  },
  channels: {},
  handler: async () => {},
})

function handleSQLError(err: any, logger: IntegrationLogger) {
  if (err instanceof sql.ConnectionError) {
      handleConnectionError(err, logger)
  } else if (err instanceof sql.TransactionError) {
      handleTransactionError(err, logger)
  } else if (err instanceof sql.RequestError) {
      handleRequestError(err, logger)
  } else if (err instanceof sql.PreparedStatementError) {
      handlePreparedStatementError(err, logger)
  } else {
      logger.forBot().error(`Unknown SQL error: ${err.message}`)
  }

  if (err.originalError) {
      logger.forBot().error(`Original error: ${err.originalError.message}`)
  }

  if (err.precedingErrors) {
      err.precedingErrors.forEach((precedingError :any , index: any) => {
          logger.forBot().error(`Preceding error ${index + 1}: ${precedingError.message}`)
      })
  }
}

function handleConnectionError(err: any, logger: IntegrationLogger) {
  switch (err.code) {
      case 'ELOGIN':
          logger.forBot().error('Login failed for user.')
          break
      case 'ETIMEOUT':
          logger.forBot().error('Connection timeout.')
          break
      case 'EDRIVER':
          logger.forBot().error('Unknown driver.')
          break
      case 'EALREADYCONNECTED':
          logger.forBot().error('Database is already connected!')
          break
      case 'EALREADYCONNECTING':
          logger.forBot().error('Already connecting to database!')
          break
      case 'ENOTOPEN':
          logger.forBot().error('Connection not yet open.')
          break
      case 'EINSTLOOKUP':
          logger.forBot().error('Instance lookup failed.')
          break
      case 'ESOCKET':
          logger.forBot().error('Socket error.')
          break
      case 'ECONNCLOSED':
          logger.forBot().error('Connection is closed.')
          break
      default:
          logger.forBot().error(`Connection error: ${err.message}`)
  }
}

function handleTransactionError(err: any, logger: IntegrationLogger) {
  switch (err.code) {
      case 'ENOTBEGUN':
          logger.forBot().error('Transaction has not begun.')
          break
      case 'EALREADYBEGUN':
          logger.forBot().error('Transaction has already begun.')
          break
      case 'EREQINPROG':
          logger.forBot().error("Can't commit/rollback transaction. There is a request in progress.")
          break
      case 'EABORT':
          logger.forBot().error('Transaction has been aborted.')
          break
      default:
          logger.forBot().error(`Transaction error: ${err.message}`)
  }
}

function handleRequestError(err: any, logger: IntegrationLogger) {
  switch (err.code) {
      case 'EREQUEST':
          logger.forBot().error('Message from SQL Server.')
          break
      case 'ECANCEL':
          logger.forBot().error('Request cancelled.')
          break
      case 'ETIMEOUT':
          logger.forBot().error('Request timeout.')
          break
      case 'EARGS':
          logger.forBot().error('Invalid number of arguments.')
          break
      case 'EINJECT':
          logger.forBot().error('SQL injection warning.')
          break
      case 'ENOCONN':
          logger.forBot().error('No connection is specified for that request.')
          break
      default:
          logger.forBot().error(`Request error: ${err.message}`)
  }

  if (err.code === 'EREQUEST') {
      logger.forBot().error(`Error number: ${err.number}, state: ${err.state}, class: ${err.class}, line number: ${err.lineNumber}, server: ${err.serverName}, procedure: ${err.procName}`)
  }
}

function handlePreparedStatementError(err: any, logger: IntegrationLogger) {
  switch (err.code) {
      case 'EARGS':
          logger.forBot().error('Invalid number of arguments for prepared statement.')
          break
      case 'EINJECT':
          logger.forBot().error('SQL injection warning for prepared statement.')
          break
      case 'EALREADYPREPARED':
          logger.forBot().error('Statement is already prepared.')
          break
      case 'ENOTPREPARED':
          logger.forBot().error('Statement is not prepared.')
          break
      default:
          logger.forBot().error(`Prepared statement error: ${err.message}`)
  }
}