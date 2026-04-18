package com.startupai;

import java.util.List;

public record StartupPlan(
        String title,
        List<Phase> phases,
        IdeaValidation ideaValidation,
        Legal legal,
        Mvp mvp
) {
    public record Phase(
            String name,
            String timeframe,
            List<WeekPlan> weeks,
            List<String> ongoingActions
    ) {
    }

    public record WeekPlan(
            String label,
            List<String> tasks
    ) {
    }

    public record IdeaValidation(
            List<String> targetUsers,
            String valueProposition,
            List<String> revenueModel,
            List<String> actions
    ) {
    }

    public record Legal(
            List<String> steps,
            List<String> actions
    ) {
    }

    public record Mvp(
            List<String> phases
    ) {
    }
}
