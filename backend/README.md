
# ResumeAI .NET Backend

This folder contains a .NET 9 Web API backend for the ResumeAI application.

## Structure

- `ResumeAI.API` - The main Web API project

## Getting Started

1. Install [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
2. Navigate to the `ResumeAI.API` directory
3. Run `dotnet restore` to restore dependencies
4. Run `dotnet build` to build the project
5. Run `dotnet run` to start the API

The API will be available at:
- HTTPS: https://localhost:5001
- HTTP: http://localhost:5000

## API Documentation

When running, Swagger documentation is available at:
- https://localhost:5001/swagger

## Authentication

The API uses JWT (JSON Web Token) authentication. To access protected endpoints:
1. First, use the login or signup endpoints to get a token
2. Include the token in the Authorization header of subsequent requests:
   `Authorization: Bearer {your-token}`

## Integration with Python

The Web API can be extended to communicate with Python APIs. To integrate:
1. Use HttpClient in your service classes to make calls to Python endpoints
2. For more complex scenarios, consider using gRPC or message queues

## Frontend Integration

The React frontend connects to this API through the `apiClient.ts` utility. Make sure the API_URL in that file points to your running .NET API instance.
