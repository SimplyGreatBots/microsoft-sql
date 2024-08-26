import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'

const sqlResult = z.object({
  result: z.object({
    recordset: z.array(z.any()).optional().describe('First recordset returned by the query, commonly used if only one result set is expected.'),
    recordsets: z.array(z.any()).optional().describe('All recordsets returned by the query, applicable if multiple result sets are expected.'),
    rowsAffected: z.array(z.number()).describe('Array detailing the number of rows affected by each operation.'),
    output: z.record(z.any()).optional().describe('Object containing output values from the query, typically used with stored procedures.')
  }).describe('Detailed result object containing data about the operation including rows affected and any records returned.')
})

export type ResultType = { 
  result: {
    output: any,
    rowsAffected: number[],
    recordset: any[],
    recordsets: any[]
  }
 }

export default new IntegrationDefinition({
  name: integrationName,
  title: 'Microsoft SQL',
  description: 'Microsoft SQL integration to manage database operations directly within your bot.',
  version: '1.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  channels: {},
  configuration: {
    schema: z.object({
      user: z.string().describe('The user name to connect to the database.'),
      password: z.string().describe('The password for the user.'),
      instanceName: z.string().describe('The server instance to connect to.'),
      database: z.string().describe('Name of the database to connect to.'),
      port: z.number().describe('The port to connect to the database.'),
    }),
  },
  actions: {
    createTable: {
      title: 'Create Table',
      description: 'Create a table in the database.',
      input: {
        schema: z.object({
          tableName: z.string().describe('Name of the table to create.'),
          data: z.string().describe('JSON Object representing the table schema.'),
        }),
      },
      output: {
        schema: z.object({})
      },
    },
    dropTable: {
      title: 'Drop Table',
      description: 'Drop a table from the database.',
      input: {
        schema: z.object({
          tableName: z.string().describe('Name of the table to drop.'),
        }),
      },
      output:{
        schema: z.object({})
      },
    },
     insertData: {
      title: 'Insert Data',
      description: 'Insert data in to the database.',
      input: {
        schema: z.object({
          tableName: z.string().describe('Name of the table to insert data into.'),
          data: z.string().describe('JSON array representing the data to insert.'),
        }),
      },
      output: {
        schema: sqlResult
      },  
    },
    updateData: {
      title: 'Update Data',
      description: 'Update data in the database.',
      input: {
        schema: z.object({
          tableName: z.string().describe('Name of the table to update data in.'),
          data: z.string().describe('Stringified JSON object representing the data to update.'),
          conditions: z.string().describe('Conditions for which rows to update, specified in SQL WHERE clause format.')
        })
      },
      output: {
        schema: sqlResult
      }
    },
    deleteData: {
      title: 'Delete Data',
      description: 'Delete data in the database.',
      input: {
        schema: z.object({
          tableName: z.string().describe('Name of the table to delete data from.'),
          conditions: z.string().describe('Conditions for which rows to delete, specified in SQL WHERE clause format.')
        })
      },
      output: {
        schema: sqlResult
      }
    },
    queryData: {
      title: 'Query Data',
      input: {
        schema: z.object({
          query: z.string().describe('SQL query to execute.'),
        }),
      },
      output: {
        schema: sqlResult
      },
    }
  }
})