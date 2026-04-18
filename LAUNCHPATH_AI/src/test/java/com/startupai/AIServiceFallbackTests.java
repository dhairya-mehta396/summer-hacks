package com.startupai;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;

class AIServiceFallbackTests {

    private final AIService service = new AIService("", "https://api.groq.com/openai/v1", "openai/gpt-oss-20b");

    @Test
    void generateResultFallsBackWhenApiKeyIsMissing() {
        StartupPlan plan = service.generateResult("AI budget planner for students","English");

        assertFalse(plan.ideaValidation().targetUsers().isEmpty());
        assertFalse(plan.legal().steps().isEmpty());
        assertFalse(plan.mvp().phases().isEmpty());
    }

    @Test
    void chatFallsBackWhenApiKeyIsMissing() {
        String reply = service.chatWithIdeaO();
                "AI budget planner for students",
                List.of(new StartupController.ChatMessage("user", "Who is this for?")),
                "How should I price it?","English"
        );

        assertFalse(reply.isBlank());
    }
}
