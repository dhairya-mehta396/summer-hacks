package com.startupai;

import java.util.List;

public record BudgetFundingReport(
        String title,
        String estimatedCostRange,
        Breakdown breakdown,
        String monthlyBurn,
        String breakEvenTime,
        String breakEvenExplanation,
        List<FundingOption> fundingOptions,
        List<Scheme> governmentSchemes,
        List<String> keyInsights,
        String costOptimizedStrategy,
        String aggressiveGrowthStrategy
) {
    public record Breakdown(
            String development,
            String team,
            String operations
    ) {
    }

    public record FundingOption(
            String name,
            String reason
    ) {
    }

    public record Scheme(
            String name,
            String benefit,
            String link
    ) {
    }
}
