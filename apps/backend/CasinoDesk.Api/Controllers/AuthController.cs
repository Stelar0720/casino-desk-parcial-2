using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public ActionResult<AuthResponse> Login([FromBody] LoginRequest request)
        => Ok(_authService.Login(request));

    [HttpPost("refresh")]
    public ActionResult<object> Refresh() => Ok(new { message = "Refresh token endpoint listo para implementacion persistente." });

    [HttpPost("logout")]
    public ActionResult<object> Logout() => Ok(new { message = "Logout invalida el refresh token en implementacion persistente." });
}
