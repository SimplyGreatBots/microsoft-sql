import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'

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
      server: z.string().describe('The server to connect to. Can be an IP address or a domain name.'),
      database: z.string().describe('Name of the database to connect to.'),
    }),
  },
  actions: {
    createTable: {
      title: 'Create Table',
      input: {
        schema: z.object({
          table: z.string().describe('Stringified JSON object representing the table to create.'),
        }),
      },
      output: {
        schema: z.object({
        })
      },
      description: 'Create a table in the database.',
    }
  }
})
