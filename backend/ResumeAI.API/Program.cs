using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using ResumeAI.API.Services;
using ResumeAI.API.Models;
using System.Text;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);
// Log the current working directory
Console.WriteLine("Workspace Folder Path: " + Environment.CurrentDirectory);


// Add services to the container.
builder.Services.AddControllers();

// Add CORS policy - FIXED to allow all origins in development
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // Allow any origin in development
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Allow credentials (cookies, auth headers)
    });
});

// Add JWT authentication with relaxed validation for Supabase tokens
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,          // Don't validate issuer for Supabase compatibility
        ValidateAudience = false,        // Don't validate audience for Supabase compatibility
        ValidateLifetime = true,         // Validate token lifetime
        ValidateIssuerSigningKey = true, // Validate signing key for Supabase tokens
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "defaultSecretKeyForDevelopment"))
    };
    
    // Don't throw exceptions on token validation failures
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"Authentication failed: {context.Exception.Message}");
            return Task.CompletedTask;
        },
        OnMessageReceived = context =>
        {
            Console.WriteLine($"JWT Message received, token: {context.Token?.Substring(0, Math.Min(20, context.Token?.Length ?? 0))}...");
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            Console.WriteLine("Token validated successfully");
            return Task.CompletedTask;
        }
    };
});

// Register app settings
var appSettings = new AppSettings
{
    PythonApiBaseUrl = builder.Configuration["PythonApi:BaseUrl"] ?? "http://localhost:8000"
};
builder.Services.AddSingleton(appSettings);

// Register services
builder.Services.AddHttpClient();
builder.Services.AddSingleton<SupabaseHttpClientService>();
builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<ResumeService>();
builder.Services.AddSingleton<ActivityLogService>();
builder.Services.AddSingleton<JobsService>();
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<RecruiterSubscriptionService>();
builder.Services.AddSingleton<CandidateSubscriptionService>();
builder.Services.AddSingleton<ResumeBuilderService>();

// Configure storage service based on configuration
var storageProvider = builder.Configuration["Storage:Provider"] ?? "AzureBlobStorage";
if (string.Equals(storageProvider, "Supabase", StringComparison.OrdinalIgnoreCase))
{
    Console.WriteLine("Using Supabase Storage provider");
    builder.Services.AddHttpClient<SupabaseStorageService>();
    builder.Services.AddSingleton<IStorageService, SupabaseStorageService>();
}
else if (string.Equals(storageProvider, "AzureBlobStorage", StringComparison.OrdinalIgnoreCase))
{
    Console.WriteLine("Using Azure Blob Storage provider");
    builder.Services.AddSingleton<IStorageService, BlobStorageService>();
}
else
{
    throw new InvalidOperationException($"Unknown storage provider: {storageProvider}. Valid options are 'Supabase' or 'AzureBlobStorage'.");
}

builder.Services.AddSingleton<ProfileMetadataService>();

// Add health endpoint
builder.Services.AddHealthChecks();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter 'Bearer {token}' in the field below",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new List<string>()
        }
    });
});

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Add health check endpoint
app.MapHealthChecks("/api/health");

app.UseHttpsRedirection();

// Add CORS middleware - must be before Authentication/Authorization
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Log startup
Console.WriteLine("ResumeAI API starting up...");

app.Run();
