package com.startupai;

import java.net.URI;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StartupController {
    private static final Logger log = LoggerFactory.getLogger(StartupController.class);

    private final AIService aiService;

    public StartupController(AIService aiService) {
        this.aiService = aiService;
    }

    @GetMapping("/favicon.ico")
    public ResponseEntity<Void> favicon() {
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, URI.create("/favicon.svg").toString())
                .build();
    }

    @PostMapping("/generate")
    public ResponseEntity<GenerateResponse> generate(@RequestBody GenerateRequest request) {
        try {
            validateIdea(request.idea());
            log.info("Generate request received. ideaLength={}", request.idea().trim().length());
            StartupPlan plan = aiService.generateResult(request.idea(), request.language());
            log.info("Generate request completed. hasIdeaValidation={} hasLegal={} hasMvp={}",
                    plan.ideaValidation() != null, plan.legal() != null, plan.mvp() != null);
            return ResponseEntity.ok(new GenerateResponse(true, plan, null));
        } catch (AppException exception) {
            log.error("Generate request failed: {}", exception.getMessage(), exception);
            return ResponseEntity.status(exception.getStatus())
                    .body(new GenerateResponse(false, null, exception.getMessage()));
        } catch (Exception exception) {
            log.error("Unexpected generate request failure", exception);
            return ResponseEntity.internalServerError()
                    .body(new GenerateResponse(false, null, "AI failed to generate response"));
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<ValidateResponse> validate(@RequestBody GenerateRequest request) {
        try {
            validateIdea(request.idea());
            log.info("Validate request received. ideaLength={}", request.idea().trim().length());
            StartupIdeaValidationReport report = aiService.validateIdea(request.idea(), request.language());
            log.info("Validate request completed. overallScore={} overallRating={}",
                    report.overallScore(), report.overallRating());
            return ResponseEntity.ok(new ValidateResponse(true, report, null));
        } catch (AppException exception) {
            log.error("Validate request failed: {}", exception.getMessage(), exception);
            return ResponseEntity.status(exception.getStatus())
                    .body(new ValidateResponse(false, null, exception.getMessage()));
        } catch (Exception exception) {
            log.error("Unexpected validate request failure", exception);
            return ResponseEntity.internalServerError()
                    .body(new ValidateResponse(false, null, "AI failed to validate startup idea"));
        }
    }

    @PostMapping("/budget")
    public ResponseEntity<BudgetResponse> budget(@RequestBody BudgetRequest request) {
        try {
            validateIdea(request.idea());
            validateSelection(request.businessType(), "Business type");
            validateSelection(request.teamSize(), "Team size");
            validateSelection(request.location(), "Location");
            log.info("Budget request received. businessType={} teamSize={} location={}",
                    request.businessType(), request.teamSize(), request.location());
            BudgetFundingReport report = aiService.calculateBudget(
                    request.idea(),
                    request.businessType(),
                    request.teamSize(),
                    request.location(),
                    request.language()
            );
            log.info("Budget request completed. monthlyBurn={} breakEven={}",
                    report.monthlyBurn(), report.breakEvenTime());
            return ResponseEntity.ok(new BudgetResponse(true, report, null));
        } catch (AppException exception) {
            log.error("Budget request failed: {}", exception.getMessage(), exception);
            return ResponseEntity.status(exception.getStatus())
                    .body(new BudgetResponse(false, null, exception.getMessage()));
        } catch (Exception exception) {
            log.error("Unexpected budget request failure", exception);
            return ResponseEntity.internalServerError()
                    .body(new BudgetResponse(false, null, "Budget calculation failed"));
        }
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        try {
            validateIdea(request.idea());
            validateMessage(request.message());
            log.info("Chat request received. message={}", abbreviate(request.message(), 180));
            String reply = aiService.chatWithIdea(
                    request.idea(),
                    request.history(),
                    request.message(),
                    request.language(),
                    request.mode(),
                    request.currentStage(),
                    request.validationSummary(),
                    request.budgetSummary()
            );
            if (reply == null || reply.isBlank()) {
                log.error("Chat request returned empty response");
                return ResponseEntity.internalServerError()
                        .body(new ChatResponse(false, null, "No response generated. Try again."));
            }
            log.info("Chat response generated. reply={}", abbreviate(reply, 220));
            return ResponseEntity.ok(new ChatResponse(true, reply, null));
        } catch (AppException exception) {
            log.error("Chat request failed: {}", exception.getMessage(), exception);
            return ResponseEntity.status(exception.getStatus())
                    .body(new ChatResponse(false, null, exception.getMessage()));
        } catch (Exception exception) {
            log.error("Unexpected chat request failure", exception);
            return ResponseEntity.internalServerError()
                    .body(new ChatResponse(false, null, "AI failed to generate response"));
        }
    }

    private void validateIdea(String idea) {
        if (idea == null || idea.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Idea is required.");
        }
    }

    private void validateMessage(String message) {
        if (message == null || message.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chat message is required.");
        }
    }

    private void validateSelection(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
        }
    }

    private String abbreviate(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        String normalized = value.replaceAll("\\s+", " ").trim();
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, maxLength - 3) + "...";
    }

    public record GenerateRequest(String idea, String language) {
    }

    public record ChatRequest(
            String idea,
            String message,
            List<ChatMessage> history,
            String language,
            String mode,
            String currentStage,
            String validationSummary,
            String budgetSummary
    ) {
    }

    public record BudgetRequest(String idea, String businessType, String teamSize, String location, String language) {
    }

    public record GenerateResponse(boolean success, StartupPlan data, String message) {
    }

    public record ValidateResponse(boolean success, StartupIdeaValidationReport data, String message) {
    }

    public record BudgetResponse(boolean success, BudgetFundingReport data, String message) {
    }

    public record ChatResponse(boolean success, String data, String message) {
    }

    public record ChatMessage(String role, String content) {
    }
}
