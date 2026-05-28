using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = signingKey
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Policies.OperatorAccess, policy => policy.RequireRole("Cajero", "Dealer", "Supervisor", "Administrador"));
    options.AddPolicy(Policies.OfficerAccess, policy => policy.RequireRole("Oficial", "Administrador"));
    options.AddPolicy(Policies.RosAccess, policy => policy.RequireRole("Oficial", "Supervisor", "Administrador"));
});

builder.Services.AddSingleton(signingKey);
builder.Services.AddSingleton<IAuditLogger, InMemoryAuditLogger>();
builder.Services.AddSingleton<ICustomerIdentityHasher, CustomerIdentityHasher>();
builder.Services.AddSingleton<IRiskConsolidator, RiskConsolidator>();
builder.Services.AddSingleton<IScreeningProvider, MockAmlScreeningProvider>();
builder.Services.AddSingleton<IPepProvider, MockPepProvider>();
builder.Services.AddSingleton<ICasinoDeskRepository, InMemoryCasinoDeskRepository>();
builder.Services.AddSingleton<IStructuringDetector, StructuringDetector>();
builder.Services.AddSingleton<ITransactionService, TransactionService>();
builder.Services.AddSingleton<IRteService, RteService>();
builder.Services.AddSingleton<IRosService, RosService>();
builder.Services.AddSingleton<IAuthService, AuthService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
