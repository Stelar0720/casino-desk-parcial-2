using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("screening")]
[Authorize]
public sealed class ScreeningController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public ScreeningController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    [HttpPost("run")]
    public async Task<ActionResult<object>> Run([FromBody] ScreeningRunRequest request, CancellationToken cancellationToken)
    {
        var result = await _transactionService.ScreeningOnlyAsync(request, cancellationToken);
        return Ok(result);
    }
}
