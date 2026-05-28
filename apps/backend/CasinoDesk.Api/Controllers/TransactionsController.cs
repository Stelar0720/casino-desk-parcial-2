using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("transactions")]
[Authorize]
public sealed class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;
    private readonly ICasinoDeskRepository _repository;

    public TransactionsController(ITransactionService transactionService, ICasinoDeskRepository repository)
    {
        _transactionService = transactionService;
        _repository = repository;
    }

    [HttpGet]
    public ActionResult<object> GetAll() => Ok(_repository.Transactions);

    [HttpPost("buy-in")]
    [Authorize(Policy = Policies.OperatorAccess)]
    public async Task<ActionResult<TransactionResponse>> BuyIn([FromBody] TransactionRequest request, CancellationToken cancellationToken)
        => Ok(await _transactionService.RegisterAsync(TransactionType.BuyIn, request, User.Identity?.Name ?? "Sistema", cancellationToken));

    [HttpPost("cash-out")]
    [Authorize(Policy = Policies.OperatorAccess)]
    public async Task<ActionResult<TransactionResponse>> CashOut([FromBody] TransactionRequest request, CancellationToken cancellationToken)
        => Ok(await _transactionService.RegisterAsync(TransactionType.CashOut, request, User.Identity?.Name ?? "Sistema", cancellationToken));
}
