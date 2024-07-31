## Botpress SQL Integration

### What it is
This integration enables your chatbot to directly interact with SQL databases. Perform various database operations like creating tables, inserting data, and querying directly through your chatbot. 

### How it Works
When this integration is enabled, it allows the bot to execute SQL commands directly from within Botpress using the configured database credentials. Here's how you can utilize the SQL capabilities:

- **Create Table**: Easily define and create new tables.
- **Insert Data**: Insert new records into your tables.
- **Update Data**: Modify existing data.
- **Delete Data**: Remove unwanted data.
- **Query Data**: Retrieve information based on specific queries.

#### Setting Up SQL and NGROK

To set up SQL and NGROK for your chatbot integration, follow these steps:

1. Install and configure SQL Server: Install SQL Server on your machine or use a cloud-based SQL service. Make sure you have the necessary credentials (username and password) to access the SQL server. 

Server Settings in SQL Server Configuration Manager:
Enable TCP/IP: Ensure that TCP/IP protocol is enabled in the SQL Server Configuration Manager. Navigate to SQL Server Network Configuration -> Protocols -> TCP/IP and enable it if it's not already enabled. Under IP Addresses set IPALL TCP Port to the port of your choosing (Default is 1433)

2. Configure NGROK: NGROK allows you to expose your local server to the internet. Download and install NGROK, then follow the instructions to set up a tunnel to your local SQL server. This should point to the port from above.

3. Update Botpress configuration: In your Botpress configuration file, specify the SQL server details, including the username, password, instance name, database name, and port number.


### Configuration Details
- **User**: The username for your SQL account.
- **Password**: The password for your SQL account.
- **Instance Name**: The name of your server instance.
- **Database**: Name of the database to be accessed.
- **Port**: The port number your database listens on. This should be the NGROK forwarding port from the `Configure NGROK` section.

### Actions

#### Create Table 

This action allows you to create a new table by providing a name for the table and a stringified JSON object that defines the table's structure. The JSON object must have an array called "columns" which contains the column definitions.

```Example: 
{
  "columns": [
    { "name": "EmployeeId", "type": "INT", "required": true },
    { "name": "FirstName", "type": "VARCHAR", "size": 100, "required": true },
    { "name": "LastName", "type": "VARCHAR", "size": 100, "required": true },
    { "name": "JobTitle", "type": "VARCHAR", "size": 100, "required": true }
  ]
}
```

#### Drop Table

This action allows you to drop a table from the database. Provide the name of the table you want to drop.

```Example:
TableName = "MyEmployees"
```

#### Insert Data
 
 This action allows you to insert data into the table. Provide an array of objects, where each object represents a row of data. Each object should have properties corresponding to the column names and their respective values.

  ```Example: [
  {
    "EmployeeId": 1,
    "FirstName": "John",
    "LastName": "Doe",
    "JobTitle": "Software Engineer"
  },
  {
    "EmployeeId": 2,
    "FirstName": "Jane",
    "LastName": "Smith",
    "JobTitle": "Project Manager"
  },
  {
    "EmployeeId": 3,
    "FirstName": "Alice",
    "LastName": "Johnson",
    "JobTitle": "UX Designer"
  },
  {
    "EmployeeId": 4,
    "FirstName": "Bob",
    "LastName": "Brown",
    "JobTitle": "Data Analyst"
  }
]
```

#### Delete Data

This action allows you to delete data from the table based on specific conditions. Provide the conditions to identify the rows to be deleted.

```Example:
Conditions: FirstName = 'Jane' AND LastName = 'Smith'
```

#### Update Data

This action allows you to update existing data in the table. Provide the column names and their new values for the rows you want to update, along with the condition to identify the rows to be updated.

  ```Example: 
  Data = {
    JobTitle: 'Senior Software Engineer'
  }

  Conditions: EmployeeId = 1
  ```

### Query Data
This action allows you to retrieve information from the table based on specific queries. Use the query statement to specify the columns you want to retrieve.

```Example: 
SELECT * FROM MyEmployees WHERE JobTitle = 'Senior Software Engineer'
```
