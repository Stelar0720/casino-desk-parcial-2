using CasinoDesk.Api.Domain;

namespace CasinoDesk.Api.Contracts;

public sealed record LoginRequest(string Username, string Password);

public sealed record AuthResponse(
    string AccessToken,
    string RefreshToken,
    string FullName,
    Role Role,
    string Station
);
