using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("rte")]
[Authorize]
public sealed class RteController : ControllerBase
{
    private readonly IRteService _rteService;

    public RteController(IRteService rteService)
    {
        _rteService = rteService;
    }

    [HttpGet]
    [Authorize(Policy = Policies.OfficerAccess)]
    public ActionResult<object> GetAll() => Ok(_rteService.GetAll());

    [HttpPost]
    [Authorize(Policy = Policies.OperatorAccess)]
    public ActionResult<object> Create([FromBody] RteCreateRequest request)
        => Ok(_rteService.Create(request, User.Identity?.Name ?? "Sistema"));

    [HttpPatch("{id:guid}/approve")]
    [Authorize(Policy = Policies.OfficerAccess)]
    public ActionResult Approve(Guid id)
    {
        _rteService.Approve(id, User.Identity?.Name ?? "Oficial");
        return NoContent();
    }
}
