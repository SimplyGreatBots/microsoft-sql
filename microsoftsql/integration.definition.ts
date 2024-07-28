import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'
import { query, rows } from 'mssql'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'Microsoft SQL',
  description: 'Microsoft SQL integration to manage database operations directly within your bot.',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  channels: {},
  configuration: {
    schema: z.object({
      user: z.string().optional().describe('The user name to connect to the database.'),
      password: z.string().optional().describe('The password for the user.'),
      instanceName: z.string().describe('The server to connect to. Can be an IP address or a domain name.'),
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
          data: z.string().describe('Stringified JSON array representing the table to create.'),
        }),
      },
      output: {
        schema: z.object({
        })
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
          data: z.string().describe('Stringified JSON array representing the data to insert.'),
        }),
      },
      output: {
        schema: z.object({})
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
        schema: z.object({
          result: z.any().describe('Detailed result object containing data about the operation including rows affected and any records returned.')
        })
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
        schema: z.object({
          result: z.any().describe('Detailed result object containing data about the operation including rows affected and any records returned.')
        })
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
        schema: z.object({
          data: z.array(z.any()).describe('Array of objects representing the data returned by the query.'),
        })
      },
    }
  }
})
