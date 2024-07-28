import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import * as sql from 'mssql'

type IntegrationLogger = bp.Client['client']['logger']
type IntegrationCtx = bp.Client['client']['ctx']

type QueryDataOutput = bp.actions.queryData.output.Output
type UpdateDataOutput = bp.actions.updateData.output.Output
type DeleteDataOutput = bp.actions.deleteData.output.Output

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
        // Extract tableName and schema from args.input
        const { tableName, data } = args.input;

        let tableData;
        try {
            tableData = JSON.parse(data);
        } catch (error) {
            args.logger.forBot().error(`Error parsing JSON schema: ${error}`);
            throw new sdk.RuntimeError('Error. Schema is not formatted correctly. Must be a stringified JSON');
        }

        // Construct the SQL statement to create a table
        let createTableSQL = `CREATE TABLE ${tableName} (`;
        const columnDefinitions = tableData.columns.map((column: any) => {
            return `${column.name} ${column.type}${column.size ? `(${column.size})` : ''} ${column.required ? 'NOT NULL' : 'NULL'}`;
        });
        createTableSQL += columnDefinitions.join(', ') + ');';

        args.logger.forBot().info(`Constructed SQL: ${createTableSQL}`);

        // Connect to the database and execute the SQL statement
        try {
            const pool = await getOrCreatePool(args.ctx, args.logger);
            const dbResponse = await pool.request().query(createTableSQL);
            args.logger.forBot().info(`Table ${tableName} created successfully.`);
        } catch (error: any) {
            args.logger.forBot().error(`Error creating table: ${error}`);
            throw new sdk.RuntimeError(`Failed to create table ${tableName}: ${error.message}`);
        }

        return {};
    },
    dropTable: async (args): Promise<{}> => {
        args.logger.forBot().info(`Received request to drop table: ${args.input.tableName}`)
        const tableName = args.input.tableName;
        const dropTableSQL = `DROP TABLE IF EXISTS ${tableName};`;

        try {
            const pool = await getOrCreatePool(args.ctx, args.logger)
            await pool.request().query(dropTableSQL)
            args.logger.forBot().info(`Table ${tableName} dropped successfully.`)
        } catch (error: any) {
            args.logger.forBot().error(`Error dropping table ${tableName}: ${error}`)
            throw new sdk.RuntimeError(`Failed to drop table ${tableName}: ${error.message}`)
        }
        return {}
    },
    insertData: async (args): Promise<{}> => {
        // Parse the input JSON to get table data
        let rowData;
        try {
            rowData = JSON.parse(args.input.data);  // rowData is expected to be an array
        } catch (error) {
            args.logger.forBot().error(`Error parsing JSON input for data: ${error}`)
            throw new sdk.RuntimeError('Invalid JSON format for table data.')
        }

        if (!Array.isArray(rowData) || rowData.length === 0) {
            throw new sdk.RuntimeError('Data must be a non-empty array of objects.')
        }

        const tableName = args.input.tableName;
        const keys = Object.keys(rowData[0])

        // Constructing the VALUES part of the SQL query for each row
        const values = rowData.map(row => {
            const rowValues = keys.map(key => {
                const value = row[key]
                if (typeof value === 'string') {
                    return `'${value.replace(/'/g, "''")}'`
                }
                return `'${value}'`
            });
            return `(${rowValues.join(', ')})`
        }).join(', ');

        // Construct the SQL statement to insert data
        let insertDataSQL = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES ${values};`

        try {
            const pool = await getOrCreatePool(args.ctx, args.logger)
            await pool.request().query(insertDataSQL)
            args.logger.forBot().info(`Data inserted into ${tableName} successfully.`)
        } catch (error: any) {
            args.logger.forBot().error(`Error inserting data into ${tableName}: ${error}`)
            throw new sdk.RuntimeError(`Failed to insert data into ${tableName}: ${error.message}`)
        }

        return {}
    },
	updateData: async (args): Promise<UpdateDataOutput> => {
		const { tableName, data, conditions } = args.input
	
    	// Parse the stringified data to get an object
    	let updates
		try {
			updates = JSON.parse(data)
		} catch (error) {
			args.logger.forBot().error(`Invalid JSON format for update data. Must be stringable JSON object.`)
			throw new sdk.RuntimeError('Invalid JSON format for update data. Must be stringable JSON object.')
		}

		// Generate SQL 'SET' part of the query dynamically from the 'updates' object
		const setClauses = Object.keys(updates).map(key => {
			return `${key} = @${key}`
		}).join(', ')
	
		// Construct the full SQL update statement
		const updateSql = `UPDATE ${tableName} SET ${setClauses} WHERE ${conditions};`

		try {
			const pool = await getOrCreatePool(args.ctx, args.logger);
			const request = pool.request();
	
			// Add parameters to the request to prevent SQL injection
			Object.keys(updates).forEach(key => {
				request.input(key, updates[key]) 
			})
	
			const result = await request.query(updateSql)
			args.logger.forBot().info(`Update SQL executed successfuly.`)
	
			return { result: result }
		} catch (error: any) {
			args.logger.forBot().error(`Failed to execute update: ${error}`)
			throw new sdk.RuntimeError(`Failed to execute update: ${error}`)
		}
	},
	deleteData: async (args): Promise<DeleteDataOutput> => {
		const { tableName, conditions } = args.input;
		const deleteSql = `DELETE FROM ${tableName} WHERE ${conditions};`
	
		try {
			const pool = await getOrCreatePool(args.ctx, args.logger)
			const result = await pool.request().query(deleteSql)
			args.logger.forBot().info(`Delete operation executed successfully, affected ${result.rowsAffected} rows.`)
			return { result: result}
		} catch (error: any) {
			args.logger.forBot().error(`Error executing delete: ${error}`)
			throw new sdk.RuntimeError(`Failed to execute delete: ${error}`)
		}
	},
    queryData: async (args): Promise<QueryDataOutput> => {
        const query  = args.input.query
        // Get or create a pool connection
        try {
          const pool = await getOrCreatePool(args.ctx, args.logger)
          const result = await pool.request().query(query)
          args.logger.forBot().info(`Query executed successfully.`)
    
          // Prepare the data to be returned
          return {
            data: result.recordset 
          }
        } catch (error: any) {
          args.logger.forBot().error(`Error executing query: ${error}`)
          throw new sdk.RuntimeError(`Error executing query: ${error}`)
        }
    }
	,
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
  