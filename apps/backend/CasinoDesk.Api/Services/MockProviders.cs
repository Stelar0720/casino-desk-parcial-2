namespace CasinoDesk.Api.Services;

public sealed class MockAmlScreeningProvider : IScreeningProvider
{
    public Task<IReadOnlyCollection<string>> CheckAsync(string normalizedClientName, CancellationToken cancellationToken)
    {
        if (normalizedClientName.Contains("OFAC") || normalizedClientName.Contains("SANCIONADO"))
        {
            return Task.FromResult<IReadOnlyCollection<string>>(new[] { "OFAC SDN List" });
        }

        if (normalizedClientName.Contains("TIMEOUT"))
        {
            return Task.Delay(TimeSpan.FromSeconds(5), cancellationToken)
                .ContinueWith<IReadOnlyCollection<string>>(_ => Array.Empty<string>(), cancellationToken);
        }

        return Task.FromResult<IReadOnlyCollection<string>>(Array.Empty<string>());
    }
}

public sealed class MockPepProvider : IPepProvider
{
    public Task<string?> CheckAsync(string normalizedClientName, CancellationToken cancellationToken)
    {
        if (normalizedClientName.Contains("PEP") || normalizedClientName.Contains("ALCALDE"))
        {
            return Task.FromResult<string?>("Perfil PEP detectado");
        }

        return Task.FromResult<string?>(null);
    }
}
