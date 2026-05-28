using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CasinoDesk.Api.Services;

public sealed class AuthService : IAuthService
{
    private readonly ICasinoDeskRepository _repository;
    private readonly JwtOptions _options;

    public AuthService(ICasinoDeskRepository repository, IOptions<JwtOptions> options)
    {
        _repository = repository;
        _options = options.Value;
    }

    public AuthResponse Login(LoginRequest request)
    {
        var user = _repository.Users.FirstOrDefault(x =>
            string.Equals(x.Username, request.Username, StringComparison.OrdinalIgnoreCase));

        if (user is null)
        {
            throw new InvalidOperationException("Usuario no encontrado.");
        }

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("station", user.Station)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

        return new AuthResponse(
            accessToken,
            $"refresh-{user.Id:N}",
            user.FullName,
            user.Role,
            user.Station);
    }
}
