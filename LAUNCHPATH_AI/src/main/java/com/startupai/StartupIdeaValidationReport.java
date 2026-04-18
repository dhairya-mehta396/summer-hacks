package com.startupai;

import java.util.List;

public record StartupIdeaValidationReport(
        String title,
        String overallRating,
        int overallScore,
        CategoryScore marketDemand,
        CategoryScore competition,
        CategoryScore riskLevel,
        CategoryScore investmentNeed,
        CategoryScore successProbability,
        String finalVerdict,
        List<String> improvementSuggestions
) {
    public record CategoryScore(
            String label,
            String scoreLabel,
            int numericScore,
            String explanation
    ) {
    }
}
