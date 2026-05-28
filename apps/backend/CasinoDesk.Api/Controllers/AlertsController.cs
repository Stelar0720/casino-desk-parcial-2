using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("alerts")]
[Authorize(Policy = Policies.OfficerAccess)]
public sealed class AlertsController : ControllerBase
{
    private readonly ICasinoDeskRepository _repository;

    public AlertsController(ICasinoDeskRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public ActionResult<object> GetAll() => Ok(_repository.Alerts);

    [HttpPatch("{id:guid}")]
    public ActionResult Patch(Guid id, [FromBody] AlertPatchRequest request)
    {
      _repository.UpdateAlert(id, request.Status);
      return NoContent();
    }
}
