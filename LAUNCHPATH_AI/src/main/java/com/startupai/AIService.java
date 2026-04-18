package com.startupai;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.responses.Response;
import com.openai.models.responses.ResponseCreateParams;
import com.openai.models.responses.ResponseOutputItem;
import com.openai.models.responses.ResponseOutputMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Service
public class AIService {
    private static final Logger log = LoggerFactory.getLogger(AIService.class);
    private static final String LEGAL_EXPERT_ROLE = "Legal Expert (India)";
    private static final String FINANCE_EXPERT_ROLE = "Finance Expert";
    private static final String EXECUTION_EXPERT_ROLE = "Startup Execution Expert";
    private static final String MARKET_ANALYST_ROLE = "Market Analyst";
    private static final long PLAN_TIMEOUT_SECONDS = 12;
    private static final long CHAT_TIMEOUT_SECONDS = 12;

    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private volatile OpenAIClient client;

    public AIService(
            @Value("${openai.api-key:}") String apiKey,
            @Value("${openai.base-url:https://api.openai.com/v1}") String baseUrl,
            @Value("${openai.model:gpt-5.2}") String model
    ) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.model = model;
    }

    public StartupPlan generateResult(String idea, String language) {
        try {
            String roadmap = runWithTimeout(
                    () -> executePrompt(buildRoadmapPrompt(idea, language)),
                    PLAN_TIMEOUT_SECONDS,
                    "Startup plan generation timed out."
            );
            return toStartupPlan(idea, roadmap, language);
        } catch (AppException exception) {
            log.warn("Falling back to local startup plan generation: {}", exception.getMessage());
            return buildFallbackPlan(idea, language);
        }
    }

    public StartupIdeaValidationReport validateIdea(String idea, String language) {
        String normalizedIdea = idea == null ? "" : idea.trim().toLowerCase();

        int demandScore = scoreMarketDemand(normalizedIdea);
        int competitionScore = scoreCompetition(normalizedIdea);
        int riskScore = scoreRiskSafety(normalizedIdea);
        int investmentScore = scoreInvestmentEfficiency(normalizedIdea);
        int successScore = Math.max(1, Math.min(10,
                Math.round((demandScore * 0.4f) + (competitionScore * 0.2f) + (riskScore * 0.2f) + (investmentScore * 0.2f))));
        boolean hasDifferentiation = hasDifferentiationSignal(normalizedIdea);
        double weightedScore = (demandScore * 0.35d)
                + (successScore * 0.30d)
                + (competitionScore * 0.15d)
                + (riskScore * 0.10d)
                + (investmentScore * 0.10d);
        if (demandScore >= 8 && successScore >= 7 && riskScore >= 6) {
            weightedScore += 1.0d;
        }
        weightedScore = Math.max(1.0d, Math.min(10.0d, weightedScore));
        int overallScore = Math.max(1, Math.min(10, (int) Math.round(weightedScore)));
        String rating = toWeightedRating(weightedScore, demandScore, competitionScore, riskScore, hasDifferentiation);

        return new StartupIdeaValidationReport(
                localizedLabel("Startup Idea Validation Report", language),
                rating,
                overallScore,
                new StartupIdeaValidationReport.CategoryScore(
                        "Market Demand",
                        toHighMediumLow(demandScore),
                        demandScore,
                        explainMarketDemand(normalizedIdea, demandScore)
                ),
                new StartupIdeaValidationReport.CategoryScore(
                        "Competition",
                        toHighMediumLow(competitionScore),
                        competitionScore,
                        explainCompetition(normalizedIdea, competitionScore)
                ),
                new StartupIdeaValidationReport.CategoryScore(
                        "Risk Level",
                        toRiskLabel(riskScore),
                        riskScore,
                        explainRisk(normalizedIdea, riskScore)
                ),
                new StartupIdeaValidationReport.CategoryScore(
                        "Investment Need",
                        toInvestmentNeedLabel(investmentScore),
                        investmentScore,
                        explainInvestment(normalizedIdea, investmentScore)
                ),
                new StartupIdeaValidationReport.CategoryScore(
                        "Success Probability",
                        toHighMediumLow(successScore),
                        successScore,
                        explainSuccess(successScore, demandScore, competitionScore, riskScore)
                ),
                buildFinalVerdict(overallScore, demandScore, riskScore, competitionScore, language),
                buildImprovementSuggestions(normalizedIdea, demandScore, competitionScore, riskScore, investmentScore, language)
        );
    }

    public BudgetFundingReport calculateBudget(String idea, String businessType, String teamSize, String location, String language) {
        BudgetInputs inputs = resolveBudgetInputs(businessType, teamSize, location);
        int monthlyBurnMin = inputs.teamMonthlyMin + inputs.opsMonthlyMin;
        int monthlyBurnMax = inputs.teamMonthlyMax + inputs.opsMonthlyMax;
        int runwayMonthsMin = inputs.breakEvenMinMonths;
        int runwayMonthsMax = inputs.breakEvenMaxMonths;

        int totalMin = inputs.developmentMin + (monthlyBurnMin * runwayMonthsMin);
        int totalMax = inputs.developmentMax + (monthlyBurnMax * runwayMonthsMax);

        return new BudgetFundingReport(
                localizedLabel("Budget & Funding Report", language),
                formatRangeLakhs(totalMin, totalMax),
                new BudgetFundingReport.Breakdown(
                        formatRangeLakhs(inputs.developmentMin, inputs.developmentMax),
                        formatRangeLakhs(inputs.teamMonthlyMin, inputs.teamMonthlyMax) + " / month",
                        formatRangeLakhs(inputs.opsMonthlyMin, inputs.opsMonthlyMax) + " / month"
                ),
                formatRangeLakhs(monthlyBurnMin, monthlyBurnMax) + " / month",
                runwayMonthsMin + "–" + runwayMonthsMax + " months",
                buildBreakEvenExplanation(businessType, monthlyBurnMin, monthlyBurnMax, language),
                buildFundingOptions(totalMax),
                buildGovernmentSchemes(totalMax, businessType),
                buildBudgetInsights(teamSize, businessType, location, language),
                buildCostOptimizedStrategy(businessType, teamSize, language),
                buildAggressiveStrategy(businessType, language)
        );
    }

    public String generateFromAgent(String role, String idea) {
        String prompt = """
                You are acting as: %s

                User startup idea:
                %s

                Instructions:
                - Stay focused only on your specialty.
                - Give concise, practical, startup-ready advice.
                - Use plain language.
                - Include specifics instead of generic motivational language.
                - Keep the answer under 180 words.
                """.formatted(role, idea);

        return runWithTimeout(
                () -> executePrompt(prompt),
                CHAT_TIMEOUT_SECONDS,
                "Expert response timed out."
        );
    }

    public AgentOutputs generateAgentOutputs(String idea) {
        // These agent calls are independent, so parallel fan-out keeps demo latency low.
        CompletableFuture<String> legalFuture =
                CompletableFuture.supplyAsync(() -> generateFromAgent(LEGAL_EXPERT_ROLE, idea));
        CompletableFuture<String> financeFuture =
                CompletableFuture.supplyAsync(() -> generateFromAgent(FINANCE_EXPERT_ROLE, idea));
        CompletableFuture<String> executionFuture =
                CompletableFuture.supplyAsync(() -> generateFromAgent(EXECUTION_EXPERT_ROLE, idea));
        CompletableFuture<String> marketFuture =
                CompletableFuture.supplyAsync(() -> generateFromAgent(MARKET_ANALYST_ROLE, idea));

        try {
            CompletableFuture.allOf(legalFuture, financeFuture, executionFuture, marketFuture).join();
        } catch (CompletionException exception) {
            throw unwrapCompletionException(exception);
        }

        return new AgentOutputs(
                legalFuture.join(),
                financeFuture.join(),
                executionFuture.join(),
                marketFuture.join()
        );
    }

    public String chatWithIdea(
            String idea,
            List<StartupController.ChatMessage> history,
            String message,
            String language,
            String mode,
            String currentStage,
            String validationSummary,
            String budgetSummary
    ) {
        try {
            String prompt = buildChatPrompt(idea, history, message, language, mode, currentStage, validationSummary, budgetSummary);
            return runWithTimeout(
                    () -> executePrompt(prompt),
                    CHAT_TIMEOUT_SECONDS,
                    "Chat response timed out."
            );
        } catch (AppException exception) {
            log.warn("Falling back to local startup chat reply: {}", exception.getMessage());
            return buildFallbackChatReply(idea, message, language, mode, currentStage, validationSummary, budgetSummary);
        }
    }

    private <T> T runWithTimeout(Supplier<T> supplier, long timeoutSeconds, String timeoutMessage) {
        try {
            return CompletableFuture.supplyAsync(supplier::get).get(timeoutSeconds, TimeUnit.SECONDS);
        } catch (AppException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new AppException(HttpStatus.GATEWAY_TIMEOUT, timeoutMessage);
        }
    }

    private RuntimeException unwrapCompletionException(CompletionException exception) {
        Throwable cause = exception.getCause();
        if (cause instanceof AppException appException) {
            return appException;
        }
        if (cause instanceof RuntimeException runtimeException) {
            return runtimeException;
        }
        return new AppException(
                HttpStatus.BAD_GATEWAY,
                "AI provider request failed while generating the startup plan."
        );
    }

    private String buildRoadmapPrompt(String userIdea, String language) {
        return """
                You are an expert startup operator.
                Convert the startup idea into a practical 10-week execution roadmap.
                Keep the output short, structured, and execution-focused.
                Always respond in the user's selected language.
                If the language is Hinglish, mix Hindi and English naturally.

                Rules:
                Use plain text only
                No markdown tables
                No long paragraphs
                Every task must stay on one line
                Write practical weekly tasks only
                Limit each week to 3 to 5 tasks
                Cover validation, legal, MVP, go-to-market, and revenue

                Output format:
                TITLE: Startup Execution Roadmap
                PHASE 1: IDEA VALIDATION (Week 1-2)
                Week 1:
                - task
                - task
                Week 2:
                - task
                - task
                PHASE 2: LEGAL AND SETUP (Week 3-4)
                Week 3:
                - task
                Week 4:
                - task
                PHASE 3: MVP DEVELOPMENT (Week 5-8)
                Week 5:
                - task
                Continue until Week 10
                PHASE 5: SCALING AND GROWTH
                - ongoing action
                - ongoing action

                User selected language:
                %s

                USER IDEA:
                """.formatted(normalizeLanguage(language)).concat(userIdea == null ? "" : userIdea);
    }

    private StartupPlan toStartupPlan(String idea, String roadmap, String language) {
        List<String> steps = extractStepLines(roadmap);
        List<StartupPlan.Phase> phases = buildExecutionRoadmap(steps, idea, language);

        if (steps.isEmpty()) {
            return buildFallbackPlan(idea, language);
        }

        return new StartupPlan(
                localizedLabel("Startup Execution Roadmap", language),
                phases,
                new StartupPlan.IdeaValidation(
                        pickByKeyword(steps, List.of("validation", "market", "customer", "problem", "research"), 3),
                        firstMatchingValue(steps, List.of("value", "business model", "pricing", "revenue")),
                        pickByKeyword(steps, List.of("revenue", "pricing", "business model", "sales"), 3),
                        firstItems(steps, 4)
                ),
                new StartupPlan.Legal(
                        pickByKeyword(steps, List.of("legal", "compliance", "register", "policy", "tax", "license"), 4),
                        pickByKeyword(steps, List.of("legal", "finance", "operations", "sales"), 2)
                ),
                new StartupPlan.Mvp(
                        pickByKeyword(steps, List.of("product", "build", "mvp", "launch", "marketing", "growth", "scale"), 5)
                )
        );
    }

    private List<String> extractStepLines(String roadmap) {
        if (roadmap == null || roadmap.isBlank()) {
            return List.of();
        }

        String[] lines = roadmap.replace("\r", "").split("\n");
        List<String> steps = new ArrayList<>();

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isBlank()) {
                continue;
            }

            String lower = line.toLowerCase();
            if (lower.startsWith("step ")) {
                int colonIndex = line.indexOf(':');
                String value = colonIndex >= 0 ? line.substring(colonIndex + 1).trim() : line;
                steps.add(cleanStepValue(value));
            }
        }

        return steps;
    }

    private String cleanStepValue(String value) {
        String cleaned = value == null ? "" : value.trim();
        if (cleaned.isBlank()) {
            return "";
        }

        cleaned = cleaned
                .replace('*', ' ')
                .replace('|', ' ')
                .replace('•', ' ')
                .replace('#', ' ')
                .replace('`', ' ')
                .replaceAll("<br\\s*/?>", " ")
                .replaceAll("(?i)</?table>|</?tr>|</?td>|</?th>|</?p>|</?strong>|</?em>", " ")
                .replaceAll("\\s+", " ")
                .trim();

        cleaned = cleaned.replaceAll("^[-:]+\\s*", "");
        cleaned = cleaned.replaceAll("^\\d+\\s*", "");
        cleaned = cleaned.replaceAll("^\\.+\\s*", "");

        if (cleaned.equals("|") || cleaned.equals("-")) {
            return "";
        }

        return cleaned;
    }

    private List<String> pickByKeyword(List<String> steps, List<String> keywords, int limit) {
        Set<String> matches = new LinkedHashSet<>();

        for (String step : steps) {
            if (step == null || step.isBlank() || step.length() < 4) {
                continue;
            }
            String lower = step.toLowerCase();
            for (String keyword : keywords) {
                if (lower.contains(keyword)) {
                    matches.add(step);
                    break;
                }
            }
            if (matches.size() == limit) {
                break;
            }
        }

        if (matches.isEmpty()) {
            return firstItems(steps, limit);
        }

        return new ArrayList<>(matches);
    }

    private String firstMatchingValue(List<String> steps, List<String> keywords) {
        List<String> matches = pickByKeyword(steps, keywords, 1);
        return matches.isEmpty() ? "" : matches.get(0);
    }

    private List<String> firstItems(List<String> steps, int limit) {
        List<String> items = new ArrayList<>();

        for (String step : steps) {
            if (step == null || step.isBlank()) {
                continue;
            }
            items.add(step);
            if (items.size() == limit) {
                break;
            }
        }

        return items;
    }

    private StartupPlan buildFallbackPlan(String idea, String language) {
        String subject = extractSubject(idea);
        List<String> fallbackSteps = List.of(
                "Interview 10 target users and document their biggest pain point",
                "Write a one-sentence value proposition and test it on a landing page",
                "Map the current customer workflow and identify one urgent use case",
                "Register the business entity and draft founder ownership terms",
                "Publish privacy policy and terms before onboarding pilot users",
                "List required licenses, tax setup, and basic contracts",
                "Design the MVP scope around one core workflow",
                "Build onboarding, the main action, and a simple success dashboard",
                "Run a pilot with 5 early users and collect weekly feedback",
                "Launch a landing page and outreach campaign to get first customers",
                "Test pricing with pilot users and confirm willingness to pay",
                "Track retention, conversion, and referral signals every week"
        );

        return new StartupPlan(
                localizedLabel("Startup Execution Roadmap", language),
                buildExecutionRoadmap(fallbackSteps, idea, language),
                new StartupPlan.IdeaValidation(
                        List.of(
                                "Students, young professionals, and small teams who regularly deal with " + subject,
                                "Early adopters already using spreadsheets, WhatsApp groups, or manual workflows",
                                "Customers who need a faster and lower-friction way to manage " + subject
                        ),
                        "Make " + subject + " simpler, faster, and easier to trust with a focused first release.",
                        List.of(
                                "Monthly subscription for premium automation and insights",
                                "Free tier to drive adoption with paid upgrades for power users",
                                "B2B packages for institutions or teams that need shared reporting"
                        ),
                        List.of(
                                "Interview 10 target users and confirm their highest-friction workflow",
                                "Build a landing page with one clear promise and collect sign-ups",
                                "Prototype the smallest flow that proves users will return weekly",
                                "Track activation, weekly retention, and conversion from free to paid"
                        )
                ),
                new StartupPlan.Legal(
                        List.of(
                                "Register the business entity and founders agreement before onboarding paying users",
                                "Publish terms of service and a privacy policy tailored to " + subject,
                                "Review whether your workflow touches payments, sensitive personal data, or regulated activity",
                                "Use written vendor and contractor agreements before product development scales"
                        ),
                        List.of(
                                "Check local compliance requirements for customer data collection and storage",
                                "Review licenses, contracts, and compliance requirements before launch."
                        )
                ),
                new StartupPlan.Mvp(
                        List.of(
                                "Launch a basic onboarding flow focused on one core user problem",
                                "Add one high-value dashboard or recommendation feature tied to " + subject,
                                "Collect usage feedback every week and remove low-value steps",
                                "Add billing only after users complete the core workflow successfully",
                                "Launch a basic version, collect feedback, and iterate weekly."
                        )
                )
        );
    }

    private List<StartupPlan.Phase> buildExecutionRoadmap(List<String> steps, String idea, String language) {
        List<String> validationTasks = fillTasks(
                pickByKeyword(steps, List.of("validation", "market", "customer", "problem", "research", "interview", "value"), 6),
                List.of(
                        "Interview 10 target users and confirm the urgent pain point",
                        "Write a one-line value proposition and test it with prospects",
                        "Map the current workflow and identify one clear use case",
                        "Create a landing page and collect early sign-up interest",
                        "Review competitors and note pricing, positioning, and gaps",
                        "Summarize the customer segment and buying trigger"
                ),
                6
        );

        List<String> legalTasks = fillTasks(
                pickByKeyword(steps, List.of("legal", "compliance", "register", "policy", "tax", "license", "contract"), 6),
                List.of(
                        "Choose the business structure and start registration",
                        "Reserve company name and prepare founder documents",
                        "Set up tax, banking, and basic accounting workflow",
                        "Draft founder agreement and ownership split",
                        "Prepare privacy policy, terms, and customer consent flows",
                        "Review licenses or compliance requirements before launch"
                ),
                6
        );

        List<String> mvpTasks = fillTasks(
                pickByKeyword(steps, List.of("product", "build", "mvp", "launch", "prototype", "develop", "feature"), 12),
                List.of(
                        "Define the MVP scope around one core workflow",
                        "Create wireframes for onboarding and the main user action",
                        "Build the core feature set and remove non-essential features",
                        "Set up analytics for activation and retention tracking",
                        "Test the MVP internally and fix obvious friction points",
                        "Launch a pilot to 5 early users",
                        "Collect weekly feedback from pilot users",
                        "Tighten onboarding based on real usage",
                        "Prepare pricing, billing, and support basics",
                        "Document bug fixes and product improvements",
                        "Finalize a stable MVP release candidate",
                        "Prepare a short demo for early customers"
                ),
                12
        );

        List<String> gtmTasks = fillTasks(
                pickByKeyword(steps, List.of("marketing", "sales", "channel", "customer", "pricing", "revenue", "outreach"), 6),
                List.of(
                        "Launch a landing page with one clear promise",
                        "Reach out to the first 50 target users through direct channels",
                        "Run one acquisition experiment and track lead quality",
                        "Test the first pricing offer with pilot users",
                        "Publish customer proof points and onboarding content",
                        "Set weekly goals for demos, conversions, and activation"
                ),
                6
        );

        List<String> growthTasks = fillTasks(
                pickByKeyword(steps, List.of("growth", "scale", "referral", "retention", "expansion", "revenue"), 4),
                List.of(
                        "Review retention and conversion metrics every week",
                        "Double down on the best-performing acquisition channel",
                        "Turn successful pilot users into referrals and case studies",
                        "Refine pricing, onboarding, and support based on data"
                ),
                4
        );

        return List.of(
                createPhase(localizedPhase("PHASE 1: IDEA VALIDATION", language), localizedTimeframe("Week 1-2", language), localizedWeeks(List.of("Week 1", "Week 2"), language), validationTasks),
                createPhase(localizedPhase("PHASE 2: LEGAL & SETUP", language), localizedTimeframe("Week 3-4", language), localizedWeeks(List.of("Week 3", "Week 4"), language), legalTasks),
                createPhase(localizedPhase("PHASE 3: MVP DEVELOPMENT", language), localizedTimeframe("Week 5-8", language), localizedWeeks(List.of("Week 5", "Week 6", "Week 7", "Week 8"), language), mvpTasks),
                createPhase(localizedPhase("PHASE 4: GO-TO-MARKET", language), localizedTimeframe("Week 9-10", language), localizedWeeks(List.of("Week 9", "Week 10"), language), gtmTasks),
                new StartupPlan.Phase(localizedPhase("PHASE 5: SCALING & GROWTH", language), localizedLabel("Ongoing", language), List.of(), growthTasks)
        );
    }

    private StartupPlan.Phase createPhase(String name, String timeframe, List<String> weekLabels, List<String> tasks) {
        List<StartupPlan.WeekPlan> weeks = new ArrayList<>();
        int startIndex = 0;
        int weekCount = weekLabels.size();
        int base = weekCount == 0 ? 0 : tasks.size() / weekCount;
        int remainder = weekCount == 0 ? 0 : tasks.size() % weekCount;

        for (int index = 0; index < weekCount; index++) {
            int size = Math.max(1, base + (index < remainder ? 1 : 0));
            int endIndex = Math.min(tasks.size(), startIndex + size);
            List<String> weekTasks = new ArrayList<>(tasks.subList(startIndex, endIndex));
            if (weekTasks.isEmpty() && !tasks.isEmpty()) {
                weekTasks = List.of(tasks.get(Math.min(index, tasks.size() - 1)));
            }
            weeks.add(new StartupPlan.WeekPlan(weekLabels.get(index), weekTasks));
            startIndex = endIndex;
        }

        return new StartupPlan.Phase(name, timeframe, weeks, List.of());
    }

    private List<String> fillTasks(List<String> preferred, List<String> fallback, int limit) {
        List<String> items = new ArrayList<>(preferred);
        for (String item : fallback) {
            if (items.size() == limit) {
                break;
            }
            if (!items.contains(item)) {
                items.add(item);
            }
        }
        if (items.isEmpty()) {
            return fallback.subList(0, Math.min(limit, fallback.size()));
        }
        return Collections.unmodifiableList(items.subList(0, Math.min(limit, items.size())));
    }

    private String buildFallbackChatReply(
            String idea,
            String message,
            String language,
            String mode,
            String currentStage,
            String validationSummary,
            String budgetSummary
    ) {
        String subject = extractSubject(idea);
        String normalizedMessage = message == null ? "" : message.trim();

        if ("mentor".equalsIgnoreCase(mode)) {
            return buildFallbackMentorReply(subject, normalizedMessage, language, currentStage, validationSummary, budgetSummary);
        }

        if (normalizedMessage.isBlank()) {
            return structuredReply(
                    localizedTitle("Focused Startup Guidance", language),
                    List.of(
                            localizedText("Choose one narrow user problem inside ", language) + subject,
                            localizedText("Validate the problem with direct user interviews before building", language),
                            localizedText("Define the first outcome your product must deliver", language)
                    ),
                    List.of(
                            localizedText("A clear user segment", language),
                            localizedText("One painful workflow worth solving", language),
                            localizedText("A measurable success metric for the MVP", language)
                    ),
                    List.of(
                            localizedText("Customer interview notes", language),
                            localizedText("A simple landing page", language),
                            localizedText("A lightweight product spec", language)
                    ),
                    List.of(
                            localizedText("Keep the first release narrow", language),
                            localizedText("Avoid solving multiple user segments at once", language)
                    ),
                    List.of(
                            localizedText("What should my MVP include first?", language),
                            localizedText("How do I get the first customers for this startup?", language)
                    )
            );
        }

        String lowerMessage = normalizedMessage.toLowerCase();
        if (lowerMessage.contains("mvp")) {
            return structuredReply(
                    localizedTitle("MVP Execution Plan", language),
                    List.of(
                            localizedText("Define the single workflow the MVP must solve for ", language) + subject,
                            localizedText("Build onboarding, one core action, and one visible outcome", language),
                            localizedText("Track whether users complete the core action repeatedly", language)
                    ),
                    List.of(
                            localizedText("One target user segment", language),
                            localizedText("A clear activation metric", language),
                            localizedText("Feedback from at least a few early testers", language)
                    ),
                    List.of(
                            localizedText("Wireframes", language),
                            localizedText("Analytics tracking", language),
                            localizedText("A feedback collection form", language)
                    ),
                    List.of(
                            localizedText("Skip admin-heavy features in version one", language),
                            localizedText("Prioritize retention over feature count", language)
                    ),
                    List.of(
                            localizedText("How should I prioritize features after MVP launch?", language),
                            localizedText("How do I price the MVP?", language)
                    )
            );
        }
        if (lowerMessage.contains("market") || lowerMessage.contains("customer")) {
            return structuredReply(
                    localizedTitle("Market Validation Actions", language),
                    List.of(
                            localizedText("Pick one narrow customer segment already managing ", language) + subject + localizedText(" manually", language),
                            localizedText("Interview them to map pain points and current workarounds", language),
                            localizedText("Position your product as the fastest and simplest replacement", language)
                    ),
                    List.of(
                            localizedText("A shortlist of target interview candidates", language),
                            localizedText("A repeatable customer interview script", language),
                            localizedText("A clear market wedge", language)
                    ),
                    List.of(
                            localizedText("Interview tracker", language),
                            localizedText("Competitor comparison sheet", language),
                            localizedText("Landing page copy draft", language)
                    ),
                    List.of(
                            localizedText("Start with users already showing urgency", language),
                            localizedText("Use their current workaround as your positioning reference", language)
                    ),
                    List.of(
                            localizedText("How do I get my first 50 customers?", language),
                            localizedText("What should my positioning message be?", language)
                    )
            );
        }
        if (lowerMessage.contains("price") || lowerMessage.contains("revenue")) {
            return structuredReply(
                    localizedTitle("Revenue Strategy", language),
                    List.of(
                            localizedText("Identify the clearest revenue event inside ", language) + subject,
                            localizedText("Test a simple pricing model with a free trial or pilot", language),
                            localizedText("Charge more only after you prove clear value or time savings", language)
                    ),
                    List.of(
                            localizedText("A pricing hypothesis", language),
                            localizedText("A target customer willing to pay for the problem", language),
                            localizedText("A basic cost and margin estimate", language)
                    ),
                    List.of(
                            localizedText("Pricing calculator", language),
                            localizedText("Pilot offer document", language),
                            localizedText("Payment collection setup", language)
                    ),
                    List.of(
                            localizedText("Avoid complex pricing tiers too early", language),
                            localizedText("Validate willingness to pay before optimizing packaging", language)
                    ),
                    List.of(
                            localizedText("Which funding option fits this business best?", language),
                            localizedText("How much runway do I need before launch?", language)
                    )
            );
        }
        if (lowerMessage.contains("legal") || lowerMessage.contains("compliance")) {
            return structuredReply(
                    localizedTitle("Legal Setup Checklist", language),
                    List.of(
                            localizedText("Handle entity formation and founder agreements first", language),
                            localizedText("Prepare contracts, privacy policy, and terms before launch", language),
                            localizedText("Review sector-specific compliance if ", language) + subject + localizedText(" touches payments or sensitive data", language)
                    ),
                    List.of(
                            localizedText("Founder and ownership details", language),
                            localizedText("Customer data handling plan", language),
                            localizedText("A list of regulated activities in the workflow", language)
                    ),
                    List.of(
                            localizedText("Incorporation checklist", language),
                            localizedText("Policy templates", language),
                            localizedText("Legal counsel review", language)
                    ),
                    List.of(
                            localizedText("Do legal cleanup before taking paid users", language),
                            localizedText("Do not assume fintech, health, or data-heavy workflows are unregulated", language)
                    ),
                    List.of(
                            localizedText("How do I register this business in India?", language),
                            localizedText("What policies and contracts should I draft first?", language)
                    )
            );
        }

        return structuredReply(
                localizedTitle("Execution Priorities", language),
                List.of(
                        localizedText("Prioritize one painful use case inside ", language) + subject,
                        localizedText("Validate willingness to pay with direct user interviews", language),
                        localizedText("Expand features only after retention improves", language)
                ),
                List.of(
                        localizedText("A defined customer segment", language),
                        localizedText("A narrow product promise", language),
                        localizedText("A measurable traction goal", language)
                ),
                List.of(
                        localizedText("Interview notes", language),
                        localizedText("Landing page", language),
                        localizedText("Simple KPI tracker", language)
                ),
                List.of(
                        localizedText("Ask focused questions for more useful follow-ups", language),
                        localizedText("Tie every next step to a measurable signal", language)
                    ),
                List.of(
                        localizedText("What should I build first?", language),
                        localizedText("How do I validate demand quickly?", language)
                )
        );
    }

    private String extractSubject(String idea) {
        if (idea == null || idea.isBlank()) {
            return "the target workflow";
        }

        String normalized = idea.trim().replaceAll("\\s+", " ");
        if (normalized.length() <= 80) {
            return normalized;
        }
        return normalized.substring(0, 77).trim() + "...";
    }

    public StartupPlan combineOutputs(String legal, String finance, String execution, String market) {
        StartupPlan.IdeaValidation ideaValidation = new StartupPlan.IdeaValidation(
                toList(market, 3),
                firstValue(execution),
                toList(finance, 3),
                mergeLists(toList(market, 2), toList(execution, 2))
        );
        StartupPlan.Legal legalPlan = new StartupPlan.Legal(
                toList(legal, 4),
                mergeLists(
                        toList(legal, 2),
                        List.of("Review licenses, contracts, and compliance requirements before launch.")
                )
        );
        StartupPlan.Mvp mvpPlan = new StartupPlan.Mvp(
                mergeLists(
                        toList(execution, 4),
                        List.of("Launch a basic version, collect feedback, and iterate weekly.")
                )
        );

        List<String> steps = new ArrayList<>();
        steps.addAll(ideaValidation.actions());
        steps.addAll(legalPlan.steps());
        steps.addAll(mvpPlan.phases());
        steps.addAll(ideaValidation.revenueModel());

        return new StartupPlan(
                "Startup Execution Roadmap",
                buildExecutionRoadmap(steps, "the startup idea", "en"),
                ideaValidation,
                legalPlan,
                mvpPlan
        );
    }

    private String buildChatPrompt(
            String idea,
            List<StartupController.ChatMessage> history,
            String message,
            String language,
            String mode,
            String currentStage,
            String validationSummary,
            String budgetSummary
    ) {
        StringBuilder prompt = new StringBuilder("""
                You are an AI Co-founder.
                Answer the user's question in a structured, clear, and concise way using bullet points and relevant sections.
                Use the startup idea as context and stay practical.
                Avoid filler and avoid empty answers.
                Always respond in the user's selected language.
                If the language is Hinglish, mix Hindi and English naturally.
                If mode is Mentor, act like an experienced startup coach:
                - give honest, realistic advice
                - warn clearly when the user is about to make a risky decision
                - avoid motivational fluff
                - use the full system context before answering
                - focus on decision-making and execution
                If mode is Mentor, structure the response with:
                Title:
                Direct Answer:
                Reasoning:
                Common Mistakes to Avoid:
                Action Plan:
                Otherwise, structure the response with:
                Title:
                Step-by-Step Process:
                Requirements / Documents:
                Tools / Websites:
                Key Insights / Tips:
                Next Step:
                Only include relevant sections.
                If you mention tools or websites, include direct official links when possible.
                Focus on execution and keep the answer concise.

                Selected language:
                """);

        prompt.append(normalizeLanguage(language)).append("""

                Mode:
                """).append(mode == null || mode.isBlank() ? "general" : mode).append("""

                Startup idea:
                """);

        prompt.append(idea == null ? "" : idea)
                .append("\n\nCurrent stage:\n")
                .append(currentStage == null || currentStage.isBlank() ? "Unknown" : currentStage)
                .append("\n\nIdea validation summary:\n")
                .append(validationSummary == null || validationSummary.isBlank() ? "Not available" : validationSummary)
                .append("\n\nBudget summary:\n")
                .append(budgetSummary == null || budgetSummary.isBlank() ? "Not available" : budgetSummary)
                .append("\n\nConversation history:\n");

        if (history != null && !history.isEmpty()) {
            for (StartupController.ChatMessage item : history) {
                if (item == null) {
                    continue;
                }
                prompt.append(item.role()).append(": ").append(item.content()).append("\n");
            }
        } else {
            prompt.append("No prior conversation.\n");
        }

        prompt.append("\nUser follow-up question:\n").append(message == null ? "" : message);
        return prompt.toString();
    }

    private String buildFallbackMentorReply(
            String subject,
            String message,
            String language,
            String currentStage,
            String validationSummary,
            String budgetSummary
    ) {
        String normalized = message == null ? "" : message.toLowerCase();
        String directAnswer = localizedText("Do not make the high-risk move yet.", language);
        List<String> reasoning = new ArrayList<>();
        List<String> mistakes = new ArrayList<>();
        List<String> actionPlan = new ArrayList<>();

        if (normalized.contains("quit my job")) {
            directAnswer = localizedText("Do NOT quit your job immediately.", language);
            reasoning = List.of(
                    localizedText("You need stronger proof of demand before removing income stability.", language),
                    localizedText("Early startup stress rises sharply when runway and validation are both weak.", language),
                    localizedText("Keep optionality until users or revenue clearly justify the move.", language)
            );
            mistakes = List.of(
                    localizedText("Quitting before you validate demand.", language),
                    localizedText("Assuming passion can replace runway.", language),
                    localizedText("Building full-time before getting real customer signals.", language)
            );
            actionPlan = List.of(
                    localizedText("Talk to 10 target users and validate the pain clearly.", language),
                    localizedText("Get the first paying customer or strong pilot commitment.", language),
                    localizedText("Review your budget and create at least 6 months of personal runway before deciding.", language)
            );
        } else if (normalized.contains("first customer")) {
            directAnswer = localizedText("Start with direct outreach, not broad marketing.", language);
            reasoning = List.of(
                    localizedText("Early customers come faster from conversations than campaigns.", language),
                    localizedText("You need learning quality more than lead volume at this stage.", language),
                    localizedText("Direct feedback will sharpen both your offer and positioning.", language)
            );
            mistakes = List.of(
                    localizedText("Running paid ads before message clarity.", language),
                    localizedText("Trying to target everyone.", language),
                    localizedText("Pitching features instead of the pain solved.", language)
            );
            actionPlan = List.of(
                    localizedText("List 20 target users who already feel the pain.", language),
                    localizedText("Send a simple outreach message focused on the problem.", language),
                    localizedText("Use every reply to refine your pitch and offer.", language)
            );
        } else if (normalized.contains("price")) {
            directAnswer = localizedText("Use simple pricing first and validate willingness to pay quickly.", language);
            reasoning = List.of(
                    localizedText("Early pricing should test value, not optimize revenue.", language),
                    localizedText("Complex pricing confuses early customers and slows feedback.", language),
                    localizedText("A simple offer makes conversion learning much clearer.", language)
            );
            mistakes = List.of(
                    localizedText("Launching with too many tiers.", language),
                    localizedText("Copying competitor pricing without context.", language),
                    localizedText("Underpricing because of founder insecurity.", language)
            );
            actionPlan = List.of(
                    localizedText("Choose one entry offer and one premium version.", language),
                    localizedText("Ask 5 target users whether the offer feels worth paying for.", language),
                    localizedText("Review conversion and objections before changing price.", language)
            );
        } else if (normalized.contains("worth pursuing")) {
            directAnswer = localizedText("Pursue it only if the validation signals are improving fast.", language);
            reasoning = List.of(
                    localizedText("A startup should earn conviction through evidence, not excitement.", language),
                    localizedText("Your current stage and validation score matter more than the idea pitch alone.", language),
                    localizedText("Weak demand or high risk should push you toward iteration, not scaling.", language)
            );
            mistakes = List.of(
                    localizedText("Treating a weak idea as fixed instead of improvable.", language),
                    localizedText("Confusing interest with real demand.", language),
                    localizedText("Scaling before proving repeatable user pull.", language)
            );
            actionPlan = List.of(
                    localizedText("Use the validation score to identify the weakest factor.", language),
                    localizedText("Improve that factor through user interviews or a sharper wedge.", language),
                    localizedText("Re-evaluate only after new evidence appears.", language)
            );
        } else {
            reasoning = List.of(
                    localizedText("Base decisions on demand, risk, and current execution stage.", language),
                    localizedText("If validation is weak, improve the idea before adding cost or complexity.", language),
                    localizedText("If budget is tight, preserve runway and avoid premature scaling.", language)
            );
            mistakes = List.of(
                    localizedText("Making major decisions without enough user evidence.", language),
                    localizedText("Ignoring runway while increasing scope.", language),
                    localizedText("Moving to growth before fixing validation gaps.", language)
            );
            actionPlan = List.of(
                    localizedText("Check your current stage and solve the next bottleneck only.", language),
                    localizedText("Review validation and budget before making the next major commitment.", language),
                    localizedText("Take one decision this week that reduces risk and improves signal quality.", language)
            );
        }

        String stageLine = currentStage == null || currentStage.isBlank()
                ? ""
                : localizedText("Current stage considered: ", language) + currentStage;
        String validationLine = validationSummary == null || validationSummary.isBlank()
                ? ""
                : localizedText("Validation context: ", language) + validationSummary;
        String budgetLine = budgetSummary == null || budgetSummary.isBlank()
                ? ""
                : localizedText("Budget context: ", language) + budgetSummary;

        List<String> combinedReasoning = new ArrayList<>(reasoning);
        if (!stageLine.isBlank()) {
            combinedReasoning.add(stageLine);
        }
        if (!validationLine.isBlank()) {
            combinedReasoning.add(validationLine);
        }
        if (!budgetLine.isBlank()) {
            combinedReasoning.add(budgetLine);
        }

        return """
                Title:
                - %s
                Direct Answer:
                - %s
                Reasoning:
                - %s
                Common Mistakes to Avoid:
                - %s
                Action Plan:
                - %s
                """.formatted(
                localizedTitle("Startup Mentor Advice", language),
                directAnswer,
                String.join("\n- ", combinedReasoning),
                String.join("\n- ", mistakes),
                String.join("\n- ", actionPlan)
        );
    }

    private String structuredReply(
            String title,
            List<String> steps,
            List<String> requirements,
            List<String> tools,
            List<String> tips,
            List<String> nextQuestions
    ) {
        return """
                Title:
                - %s
                Steps:
                - %s
                Requirements:
                - %s
                Tools:
                - %s
                Tips:
                - %s
                Next you can ask:
                - %s
                """.formatted(
                title,
                String.join("\n- ", steps),
                String.join("\n- ", requirements),
                String.join("\n- ", tools),
                String.join("\n- ", tips),
                String.join("\n- ", nextQuestions)
        );
    }

    private String executePrompt(String prompt) {
        ensureApiKeyConfigured();

        try {
            log.info("Sending AI request. promptLength={} model={} baseUrl={}", prompt.length(), model, baseUrl);
            Response response = getClient().responses().create(
                    ResponseCreateParams.builder()
                            .model(model)
                            .input(prompt)
                            .build()
            );
            String text = extractText(response);
            log.info("AI response received. outputLength={}", text.length());
            return text;
        } catch (AppException exception) {
            throw exception;
        } catch (Exception exception) {
            String providerMessage = extractProviderMessage(exception);
            log.error("AI provider request failed: {}", providerMessage, exception);
            throw new AppException(
                    HttpStatus.BAD_GATEWAY,
                    "AI provider request failed. " + providerMessage
            );
        }
    }

    private void ensureApiKeyConfigured() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new AppException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "OpenAI API key is missing. Set openai.api-key in application.properties."
            );
        }
    }

    private OpenAIClient getClient() {
        if (client == null) {
            synchronized (this) {
                if (client == null) {
                    client = OpenAIOkHttpClient.builder()
                            .apiKey(apiKey)
                            .baseUrl(baseUrl)
                            .build();
                }
            }
        }
        return client;
    }

    private String extractText(Response response) {
        return response.output().stream()
                .filter(ResponseOutputItem::isMessage)
                .map(ResponseOutputItem::asMessage)
                .map(ResponseOutputMessage::content)
                .flatMap(content -> content.stream())
                .filter(ResponseOutputMessage.Content::isOutputText)
                .map(ResponseOutputMessage.Content::asOutputText)
                .map(outputText -> Objects.toString(outputText.text(), ""))
                .filter(text -> !text.isBlank())
                .findFirst()
                .orElseThrow(() -> new AppException(
                        HttpStatus.BAD_GATEWAY,
                        "OpenAI returned an empty response."
                ));
    }

    private String extractProviderMessage(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            return "Check your API key, model, network, or rate limits.";
        }

        if (message.contains("expired_api_key") || message.contains("Invalid API Key")) {
            return "The configured API key is invalid or expired.";
        }

        return message;
    }

    private String firstValue(String value) {
        List<String> items = toList(value, 1);
        return items.isEmpty() ? "" : items.get(0);
    }

    // Turns free-form model output into short demo-friendly bullet items.
    private List<String> toList(String value, int maxItems) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        String normalized = value
                .replace("\r", "\n")
                .replace("•", "\n")
                .replace("-", "\n");

        String[] rawItems = normalized.split("[\\n\\.]+");
        List<String> items = new ArrayList<>();

        for (String rawItem : rawItems) {
            String item = rawItem.trim();
            if (item.isBlank()) {
                continue;
            }
            items.add(item);
            if (items.size() == maxItems) {
                break;
            }
        }

        if (items.isEmpty()) {
            return List.of(value.trim());
        }

        return items;
    }

    private List<String> mergeLists(List<String> first, List<String> second) {
        List<String> merged = new ArrayList<>(first);
        merged.addAll(second);
        return merged;
    }

    private int scoreMarketDemand(String idea) {
        int score = 5;
        if (containsAny(idea, "automate", "save time", "reduce cost", "workflow", "support", "operations", "payments")) {
            score += 2;
        }
        if (containsAny(idea, "for local", "for small business", "for clinics", "for schools", "for stores", "b2b")) {
            score += 1;
        }
        if (containsAny(idea, "social network", "community app", "generic ai app", "news app")) {
            score -= 2;
        }
        return clamp(score);
    }

    private int scoreCompetition(String idea) {
        int score = 6;
        if (containsAny(idea, "ai assistant", "marketplace", "ecommerce", "fintech", "crm", "delivery", "edtech")) {
            score -= 2;
        }
        if (containsAny(idea, "for local", "for niche", "for clinics", "for restaurants", "for retailers", "whatsapp")) {
            score += 2;
        }
        return clamp(score);
    }

    private int scoreRiskSafety(String idea) {
        int score = 8;
        if (containsAny(idea, "crypto", "lending", "investment", "bank", "medical", "health", "insurance")) {
            score += 3;
        }
        if (containsAny(idea, "hardware", "iot", "robot", "drone", "manufacturing")) {
            score += 2;
        }
        return clamp(11 - score);
    }

    private int scoreInvestmentEfficiency(String idea) {
        int score = 8;
        if (containsAny(idea, "saas", "software", "assistant", "automation", "platform")) {
            score += 1;
        }
        if (containsAny(idea, "marketplace", "hardware", "robot", "drone", "logistics", "factory", "biotech")) {
            score -= 3;
        }
        return clamp(score);
    }

    private String explainMarketDemand(String idea, int score) {
        if (score >= 8) {
            return "The idea targets an operational problem with clear pain, which usually signals active demand if the user segment is specific.";
        }
        if (score >= 5) {
            return "There is likely demand, but the problem statement still needs direct user validation before committing heavily.";
        }
        return "Demand is unclear or too generic. The idea needs sharper problem definition and stronger proof that users are actively searching for help.";
    }

    private String explainCompetition(String idea, int score) {
        if (score >= 8) {
            return "Competition looks manageable if you stay focused on a narrow customer segment and a clear differentiation angle.";
        }
        if (score >= 5) {
            return "Competition is present. You will need sharper positioning, faster execution, or a niche wedge to stand out.";
        }
        return "This space is likely crowded. Without a strong wedge or underserved niche, it will be hard to win attention.";
    }

    private String explainRisk(String idea, int score) {
        if (score >= 8) {
            return "Risk looks relatively controlled. The main challenge is execution discipline, not structural blockers.";
        }
        if (score >= 5) {
            return "There are moderate legal or execution risks. These are manageable if planned early.";
        }
        return "Risk is high because the idea depends on regulation, trust, or hard operational execution.";
    }

    private String explainInvestment(String idea, int score) {
        if (score >= 8) {
            return "Capital need is relatively low. You can likely validate with a lean build and controlled hiring.";
        }
        if (score >= 5) {
            return "Capital needs are moderate. Validate with a pilot before scaling team and spend.";
        }
        return "Capital need is high. This will likely require more upfront spend on product, operations, or compliance.";
    }

    private String explainSuccess(int successScore, int demandScore, int competitionScore, int riskScore) {
        if (successScore >= 8) {
            return "Demand and feasibility are strong enough to justify pursuing the idea if you stay focused on one wedge.";
        }
        if (successScore >= 5) {
            return "The idea has potential, but success depends on sharper positioning and disciplined validation.";
        }
        return "The current version is weak. You should improve market focus or reduce execution risk before pursuing it seriously.";
    }

    private String buildFinalVerdict(int overallScore, int demandScore, int riskScore, int competitionScore, String language) {
        if (overallScore >= 8) {
            return localizedLabel("Worth pursuing. The idea appears commercially promising if you validate the niche quickly and execute with focus.", language);
        }
        if (overallScore >= 5) {
            return localizedLabel("Worth exploring, but not yet strong enough to pursue blindly. Validate demand, tighten positioning, and reduce risk first.", language);
        }
        return localizedLabel("Not strong in its current form. Rework the target user, differentiation, or business model before investing more time.", language);
    }

    private List<String> buildImprovementSuggestions(String idea, int demandScore, int competitionScore, int riskScore, int investmentScore, String language) {
        List<String> suggestions = new ArrayList<>();
        suggestions.add(localizedLabel("Interview at least 10 target users before building more.", language));
        if (competitionScore <= 6) {
            suggestions.add(localizedLabel("Narrow the idea to one underserved customer segment with a stronger wedge.", language));
        }
        if (demandScore <= 6) {
            suggestions.add(localizedLabel("Rewrite the idea around one painful problem and one measurable outcome.", language));
        }
        if (riskScore >= 6) {
            suggestions.add(localizedLabel("Map legal and dependency risks early so they do not block launch later.", language));
        }
        if (investmentScore >= 6) {
            suggestions.add(localizedLabel("Start with a lighter MVP or service-assisted version before investing heavily.", language));
        }
        suggestions.add(localizedLabel("Test pricing and willingness to pay before expanding the roadmap.", language));
        return suggestions.subList(0, Math.min(5, suggestions.size()));
    }

    private boolean containsAny(String value, String... keywords) {
        for (String keyword : keywords) {
            if (value.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private int clamp(int score) {
        return Math.max(1, Math.min(10, score));
    }

    private String toRatingColor(int score) {
        if (score >= 8) {
            return "Green";
        }
        if (score >= 5) {
            return "Yellow";
        }
        return "Red";
    }

    private String toHighMediumLow(int score) {
        if (score >= 8) {
            return "High";
        }
        if (score >= 5) {
            return "Medium";
        }
        return "Low";
    }

    private String toInvestmentNeedLabel(int score) {
        if (score >= 8) {
            return "Low";
        }
        if (score >= 5) {
            return "Medium";
        }
        return "High";
    }

    private String toRiskLabel(int score) {
        if (score >= 8) {
            return "Low";
        }
        if (score >= 5) {
            return "Medium";
        }
        return "High";
    }

    private String toWeightedRating(double weightedScore, int demandScore, int competitionScore, int riskScore, boolean hasDifferentiation) {
        if (demandScore <= 3) {
            return "Red";
        }
        if (weightedScore >= 7.5d) {
            if (riskScore <= 3) {
                return "Yellow";
            }
            if (competitionScore <= 3 && !hasDifferentiation) {
                return "Yellow";
            }
            return "Green";
        }
        if (weightedScore >= 4.5d) {
            return "Yellow";
        }
        return "Red";
    }

    private boolean hasDifferentiationSignal(String idea) {
        return containsAny(
                idea,
                "niche",
                "underserved",
                "for local",
                "for clinics",
                "for schools",
                "for restaurants",
                "for retailers",
                "for small business",
                "for creators",
                "for freelancers",
                "specific",
                "vertical",
                "specialized",
                "whatsapp"
        );
    }

    private BudgetInputs resolveBudgetInputs(String businessType, String teamSize, String location) {
        String normalizedBusiness = businessType.trim().toLowerCase();
        String normalizedTeam = teamSize.trim().toLowerCase();
        String normalizedLocation = location.trim().toLowerCase();

        int teamMembersMin;
        int teamMembersMax;
        if (normalizedTeam.contains("1")) {
            teamMembersMin = 1;
            teamMembersMax = 3;
        } else if (normalizedTeam.contains("4")) {
            teamMembersMin = 4;
            teamMembersMax = 10;
        } else {
            teamMembersMin = 10;
            teamMembersMax = 15;
        }

        int perPersonMin = normalizedLocation.contains("tier 1") ? 35000 : normalizedLocation.contains("tier 2") ? 25000 : 20000;
        int perPersonMax = normalizedLocation.contains("tier 1") ? 80000 : normalizedLocation.contains("tier 2") ? 60000 : 50000;
        int opsMin = normalizedLocation.contains("remote") ? 20000 : normalizedLocation.contains("tier 2") ? 30000 : 45000;
        int opsMax = normalizedLocation.contains("remote") ? 70000 : normalizedLocation.contains("tier 2") ? 80000 : 100000;

        int developmentMin;
        int developmentMax;
        int breakEvenMin;
        int breakEvenMax;

        if (normalizedBusiness.contains("saas")) {
            developmentMin = normalizedTeam.contains("1") ? 100000 : normalizedTeam.contains("4") ? 500000 : 1200000;
            developmentMax = normalizedTeam.contains("1") ? 500000 : normalizedTeam.contains("4") ? 1500000 : 2500000;
            breakEvenMin = 8;
            breakEvenMax = 12;
        } else if (normalizedBusiness.contains("marketplace") || normalizedBusiness.contains("e-commerce") || normalizedBusiness.contains("ecommerce")) {
            developmentMin = normalizedTeam.contains("1") ? 300000 : normalizedTeam.contains("4") ? 800000 : 1800000;
            developmentMax = normalizedTeam.contains("1") ? 1000000 : normalizedTeam.contains("4") ? 2000000 : 3500000;
            opsMin += 15000;
            opsMax += 30000;
            breakEvenMin = 10;
            breakEvenMax = 18;
        } else {
            developmentMin = normalizedTeam.contains("1") ? 100000 : normalizedTeam.contains("4") ? 300000 : 600000;
            developmentMax = normalizedTeam.contains("1") ? 300000 : normalizedTeam.contains("4") ? 800000 : 1500000;
            breakEvenMin = 6;
            breakEvenMax = 12;
        }

        return new BudgetInputs(
                developmentMin,
                developmentMax,
                teamMembersMin * perPersonMin,
                teamMembersMax * perPersonMax,
                opsMin,
                opsMax,
                breakEvenMin,
                breakEvenMax
        );
    }

    private String buildBreakEvenExplanation(String businessType, int burnMin, int burnMax, String language) {
        String normalizedBusiness = businessType.trim().toLowerCase();
        if (normalizedBusiness.contains("saas")) {
            return localizedText("SaaS can break even faster if pricing starts early and monthly burn stays controlled.", language);
        }
        if (normalizedBusiness.contains("marketplace") || normalizedBusiness.contains("e-commerce") || normalizedBusiness.contains("ecommerce")) {
            return localizedText("Marketplace and e-commerce models usually take longer because customer acquisition and operations stay heavier.", language);
        }
        return localizedText("Service-led and lean product models can reach break-even faster if founder-led sales start early.", language);
    }

    private List<BudgetFundingReport.FundingOption> buildFundingOptions(int totalMax) {
        if (totalMax <= 1200000) {
            return List.of(
                    new BudgetFundingReport.FundingOption("Bootstrapping", "Best when the build can stay lean and founders can control burn tightly."),
                    new BudgetFundingReport.FundingOption("Friends & family", "Useful for small initial runway without heavy investor pressure.")
            );
        }
        if (totalMax <= 5000000) {
            return List.of(
                    new BudgetFundingReport.FundingOption("Angel investors", "Suitable if you can show early traction, pilot users, or strong founder credibility."),
                    new BudgetFundingReport.FundingOption("Startup incubators", "Useful for small capital plus mentorship, pilots, and network access.")
            );
        }
        return List.of(
                new BudgetFundingReport.FundingOption("VC funding", "Suitable if the opportunity is large and the model needs faster scale with capital."),
                new BudgetFundingReport.FundingOption("Institutional investors", "Relevant when the startup needs a longer runway, structured diligence, and expansion capital.")
        );
    }

    private List<BudgetFundingReport.Scheme> buildGovernmentSchemes(int totalMax, String businessType) {
        List<BudgetFundingReport.Scheme> schemes = new ArrayList<>();
        schemes.add(new BudgetFundingReport.Scheme(
                "Startup India DPIIT Recognition",
                "Registration, tax benefits, easier compliance, and access to the Startup India ecosystem.",
                "https://www.startupindia.gov.in/content/sih/en/startup-scheme.html"
        ));
        schemes.add(new BudgetFundingReport.Scheme(
                "Startup India Seed Fund Scheme",
                "Seed support for proof of concept, prototype, product trials, market entry, and commercialization.",
                "https://www.startupindia.gov.in/content/sih/en/funding.html"
        ));
        if (totalMax <= 2500000) {
            schemes.add(new BudgetFundingReport.Scheme(
                    "PMEGP",
                    "Credit-linked support for new micro-enterprises, especially useful for small service and manufacturing setups.",
                    "https://www.kviconline.gov.in/pmegp/pmegpweb/docs/schemereadmore.html"
            ));
            schemes.add(new BudgetFundingReport.Scheme(
                    "MUDRA",
                    "Small business loans through partner banks and MFIs for early working-capital needs.",
                    "https://www.mudra.org.in/"
            ));
        }
        schemes.add(new BudgetFundingReport.Scheme(
                "CGTMSE",
                "Collateral-free credit guarantee support through eligible lenders for MSMEs.",
                "https://cgtmse.in/"
        ));
        if (businessType.toLowerCase().contains("service") || businessType.toLowerCase().contains("saas")) {
            schemes.add(new BudgetFundingReport.Scheme(
                    "Atal Innovation Mission / Atal Incubation Centres",
                    "Incubation support, mentors, and grant-linked ecosystem access for innovative startups.",
                    "https://www.aim.gov.in/"
            ));
        } else {
            schemes.add(new BudgetFundingReport.Scheme(
                    "ASPIRE",
                    "Support for innovation, rural industry, entrepreneurship, and incubator-linked assistance.",
                    "https://aspire.msme.gov.in/"
            ));
        }
        return schemes;
    }

    private List<String> buildBudgetInsights(String teamSize, String businessType, String location, String language) {
        List<String> insights = new ArrayList<>();
        insights.add(localizedText("Keep the first build narrow so fixed costs do not outrun learning.", language));
        insights.add(localizedText("Founder-led sales in the first 3 months can delay expensive hiring.", language));
        if (location.toLowerCase().contains("remote")) {
            insights.add(localizedText("Remote execution can materially reduce burn if hiring and tools stay disciplined.", language));
        }
        if (businessType.toLowerCase().contains("marketplace") || businessType.toLowerCase().contains("e-commerce")) {
            insights.add(localizedText("Customer acquisition and operations will likely matter more than raw build cost.", language));
        }
        if (teamSize.contains("10")) {
            insights.add(localizedText("A 10+ team before product-market fit increases runway pressure fast.", language));
        }
        return insights.subList(0, Math.min(4, insights.size()));
    }

    private String buildCostOptimizedStrategy(String businessType, String teamSize, String language) {
        if (businessType.toLowerCase().contains("saas")) {
            return localizedText("Build a no-code or low-code MVP first, keep the founding team lean, and postpone non-core hires until users repeat usage.", language);
        }
        return localizedText("Launch with a service-assisted MVP, use manual operations where possible, and validate demand before investing in full automation.", language);
    }

    private String buildAggressiveStrategy(String businessType, String language) {
        if (businessType.toLowerCase().contains("marketplace") || businessType.toLowerCase().contains("e-commerce")) {
            return localizedText("Raise a larger seed round early, spend on supply and demand acquisition together, and push fast city-wise expansion.", language);
        }
        return localizedText("Raise seed capital after early traction, hire product and growth leads quickly, and accelerate onboarding plus pricing experiments.", language);
    }

    private String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "English";
        }
        return switch (language.trim().toLowerCase()) {
            case "hi", "hindi" -> "Hindi";
            case "hinglish" -> "Hinglish";
            case "mr", "marathi" -> "Marathi";
            case "gu", "gujarati" -> "Gujarati";
            default -> "English";
        };
    }

    private String localizedLabel(String english, String language) {
        String key = language == null ? "en" : language.trim().toLowerCase();
        return switch (key) {
            case "hi" -> switch (english) {
                case "Startup Execution Roadmap" -> "स्टार्टअप एग्जीक्यूशन रोडमैप";
                case "Startup Idea Validation Report" -> "स्टार्टअप आइडिया वैलिडेशन रिपोर्ट";
                case "Budget & Funding Report" -> "बजट और फंडिंग रिपोर्ट";
                case "Ongoing" -> "जारी";
                default -> english;
            };
            case "hinglish" -> switch (english) {
                case "Startup Execution Roadmap" -> "Startup Execution Roadmap";
                case "Startup Idea Validation Report" -> "Startup Idea Validation Report";
                case "Budget & Funding Report" -> "Budget & Funding Report";
                case "Ongoing" -> "Ongoing";
                default -> english;
            };
            default -> english;
        };
    }

    private String localizedPhase(String english, String language) {
        String key = language == null ? "en" : language.trim().toLowerCase();
        if ("hi".equals(key)) {
            return switch (english) {
                case "PHASE 1: IDEA VALIDATION" -> "चरण 1: आइडिया वैलिडेशन";
                case "PHASE 2: LEGAL & SETUP" -> "चरण 2: लीगल और सेटअप";
                case "PHASE 3: MVP DEVELOPMENT" -> "चरण 3: MVP डेवलपमेंट";
                case "PHASE 4: GO-TO-MARKET" -> "चरण 4: गो-टू-मार्केट";
                case "PHASE 5: SCALING & GROWTH" -> "चरण 5: स्केलिंग और ग्रोथ";
                default -> english;
            };
        }
        return english;
    }

    private String localizedTimeframe(String english, String language) {
        String key = language == null ? "en" : language.trim().toLowerCase();
        if ("hi".equals(key)) {
            return english.replace("Week", "हफ्ता");
        }
        return english;
    }

    private List<String> localizedWeeks(List<String> weeks, String language) {
        List<String> localized = new ArrayList<>();
        for (String week : weeks) {
            localized.add(localizedTimeframe(week, language));
        }
        return localized;
    }

    private String localizedTitle(String english, String language) {
        String key = language == null ? "en" : language.trim().toLowerCase();
        return switch (key) {
            case "hi" -> switch (english) {
                case "Focused Startup Guidance" -> "फोकस्ड स्टार्टअप गाइडेंस";
                case "MVP Execution Plan" -> "MVP एग्जीक्यूशन प्लान";
                case "Market Validation Actions" -> "मार्केट वैलिडेशन एक्शन";
                case "Revenue Strategy" -> "रेवेन्यू स्ट्रैटेजी";
                case "Legal Setup Checklist" -> "लीगल सेटअप चेकलिस्ट";
                case "Execution Priorities" -> "एग्जीक्यूशन प्रायोरिटीज";
                default -> english;
            };
            default -> english;
        };
    }

    private String localizedText(String english, String language) {
        String key = language == null ? "en" : language.trim().toLowerCase();
        if (!"hi".equals(key)) {
            return english;
        }
        return switch (english) {
            case "Validate the problem with direct user interviews before building" -> "बिल्ड करने से पहले सीधे यूज़र इंटरव्यू से समस्या को वैलिडेट करें";
            case "Define the first outcome your product must deliver" -> "अपने प्रोडक्ट का पहला स्पष्ट outcome तय करें";
            case "A clear user segment" -> "एक स्पष्ट यूज़र सेगमेंट";
            case "One painful workflow worth solving" -> "एक दर्दनाक workflow जिसे solve करना जरूरी है";
            case "A measurable success metric for the MVP" -> "MVP के लिए measurable success metric";
            case "Customer interview notes" -> "कस्टमर इंटरव्यू नोट्स";
            case "A simple landing page" -> "एक simple landing page";
            case "A lightweight product spec" -> "एक lightweight product spec";
            case "Keep the first release narrow" -> "पहले release को narrow रखें";
            case "Avoid solving multiple user segments at once" -> "एक साथ कई user segments solve करने से बचें";
            case "What should my MVP include first?" -> "मेरे MVP में सबसे पहले क्या होना चाहिए?";
            case "How do I get the first customers for this startup?" -> "इस startup के पहले customers कैसे लाऊँ?";
            case "Build onboarding, one core action, and one visible outcome" -> "Onboarding, एक core action और एक visible outcome बनाएं";
            case "Track whether users complete the core action repeatedly" -> "Track करें कि user बार-बार core action complete कर रहे हैं या नहीं";
            case "One target user segment" -> "एक target user segment";
            case "A clear activation metric" -> "एक clear activation metric";
            case "Feedback from at least a few early testers" -> "कम से कम कुछ early testers का feedback";
            case "Wireframes" -> "Wireframes";
            case "Analytics tracking" -> "Analytics tracking";
            case "A feedback collection form" -> "Feedback collection form";
            case "Skip admin-heavy features in version one" -> "Version one में admin-heavy features छोड़ दें";
            case "Prioritize retention over feature count" -> "Feature count से ज़्यादा retention को prioritize करें";
            case "How should I prioritize features after MVP launch?" -> "MVP launch के बाद features कैसे prioritize करूँ?";
            case "How do I price the MVP?" -> "MVP की pricing कैसे करूँ?";
            case "Interview them to map pain points and current workarounds" -> "उनसे बात करके pain points और current workarounds map करें";
            case "Position your product as the fastest and simplest replacement" -> "अपने product को सबसे fast और simple replacement की तरह position करें";
            case "A shortlist of target interview candidates" -> "Target interview candidates की shortlist";
            case "A repeatable customer interview script" -> "Repeatable customer interview script";
            case "A clear market wedge" -> "एक clear market wedge";
            case "Interview tracker" -> "Interview tracker";
            case "Competitor comparison sheet" -> "Competitor comparison sheet";
            case "Landing page copy draft" -> "Landing page copy draft";
            case "Start with users already showing urgency" -> "उन users से शुरू करें जो पहले से urgency दिखा रहे हैं";
            case "Use their current workaround as your positioning reference" -> "उनके current workaround को positioning reference बनाएं";
            case "How do I get my first 50 customers?" -> "मेरे पहले 50 customers कैसे आएँगे?";
            case "What should my positioning message be?" -> "मेरा positioning message क्या होना चाहिए?";
            case "Test a simple pricing model with a free trial or pilot" -> "Free trial या pilot के साथ simple pricing model test करें";
            case "Charge more only after you prove clear value or time savings" -> "Clear value या time savings साबित होने के बाद ही price बढ़ाएँ";
            case "A pricing hypothesis" -> "एक pricing hypothesis";
            case "A target customer willing to pay for the problem" -> "ऐसा target customer जो इस problem के लिए pay करने को तैयार हो";
            case "A basic cost and margin estimate" -> "Basic cost और margin estimate";
            case "Pricing calculator" -> "Pricing calculator";
            case "Pilot offer document" -> "Pilot offer document";
            case "Payment collection setup" -> "Payment collection setup";
            case "Avoid complex pricing tiers too early" -> "बहुत जल्दी complex pricing tiers मत बनाइए";
            case "Validate willingness to pay before optimizing packaging" -> "Packaging optimize करने से पहले willingness to pay validate करें";
            case "Which funding option fits this business best?" -> "इस business के लिए कौन-सा funding option सबसे सही है?";
            case "How much runway do I need before launch?" -> "Launch से पहले मुझे कितना runway चाहिए?";
            case "Handle entity formation and founder agreements first" -> "Entity formation और founder agreements पहले complete करें";
            case "Prepare contracts, privacy policy, and terms before launch" -> "Launch से पहले contracts, privacy policy और terms तैयार करें";
            case "Founder and ownership details" -> "Founder और ownership details";
            case "Customer data handling plan" -> "Customer data handling plan";
            case "A list of regulated activities in the workflow" -> "Workflow में regulated activities की list";
            case "Incorporation checklist" -> "Incorporation checklist";
            case "Policy templates" -> "Policy templates";
            case "Legal counsel review" -> "Legal counsel review";
            case "Do legal cleanup before taking paid users" -> "Paid users लेने से पहले legal cleanup करें";
            case "Do not assume fintech, health, or data-heavy workflows are unregulated" -> "यह मत मानें कि fintech, health या data-heavy workflows unregulated हैं";
            case "How do I register this business in India?" -> "मैं इस business को India में कैसे register करूँ?";
            case "What policies and contracts should I draft first?" -> "मुझे सबसे पहले कौन-सी policies और contracts draft करने चाहिए?";
            case "Validate willingness to pay with direct user interviews" -> "Direct user interviews के साथ willingness to pay validate करें";
            case "Expand features only after retention improves" -> "Retention सुधरने के बाद ही features बढ़ाएँ";
            case "A defined customer segment" -> "एक defined customer segment";
            case "A narrow product promise" -> "एक narrow product promise";
            case "A measurable traction goal" -> "एक measurable traction goal";
            case "Interview notes" -> "Interview notes";
            case "Landing page" -> "Landing page";
            case "Simple KPI tracker" -> "Simple KPI tracker";
            case "Ask focused questions for more useful follow-ups" -> "बेहतर follow-ups के लिए focused questions पूछें";
            case "Tie every next step to a measurable signal" -> "हर next step को measurable signal से जोड़ें";
            case "What should I build first?" -> "मुझे सबसे पहले क्या बनाना चाहिए?";
            case "How do I validate demand quickly?" -> "मैं demand को जल्दी कैसे validate करूँ?";
            case "SaaS can break even faster if pricing starts early and monthly burn stays controlled." -> "अगर pricing जल्दी शुरू हो और monthly burn control में रहे तो SaaS जल्दी break-even कर सकता है।";
            case "Marketplace and e-commerce models usually take longer because customer acquisition and operations stay heavier." -> "Marketplace और e-commerce models में customer acquisition और operations heavy होने से break-even में ज़्यादा समय लगता है।";
            case "Service-led and lean product models can reach break-even faster if founder-led sales start early." -> "अगर founder-led sales जल्दी शुरू हो जाएँ तो service-led और lean product models जल्दी break-even तक पहुँच सकते हैं।";
            case "Keep the first build narrow so fixed costs do not outrun learning." -> "पहले build को narrow रखें ताकि fixed costs learning से आगे न निकल जाएँ।";
            case "Founder-led sales in the first 3 months can delay expensive hiring." -> "पहले 3 महीनों में founder-led sales से expensive hiring टाली जा सकती है।";
            case "Remote execution can materially reduce burn if hiring and tools stay disciplined." -> "अगर hiring और tools disciplined रहें तो remote execution burn को काफी कम कर सकता है।";
            case "Customer acquisition and operations will likely matter more than raw build cost." -> "Raw build cost से ज़्यादा customer acquisition और operations matter करेंगे।";
            case "A 10+ team before product-market fit increases runway pressure fast." -> "Product-market fit से पहले 10+ team runway pressure को बहुत तेज़ी से बढ़ा देती है।";
            case "Build a no-code or low-code MVP first, keep the founding team lean, and postpone non-core hires until users repeat usage." -> "पहले no-code या low-code MVP बनाएं, founding team को lean रखें और non-core hires को तब तक टालें जब तक users repeat usage न दिखाएँ।";
            case "Launch with a service-assisted MVP, use manual operations where possible, and validate demand before investing in full automation." -> "Service-assisted MVP के साथ launch करें, जहाँ संभव हो manual operations रखें और full automation में invest करने से पहले demand validate करें।";
            case "Raise a larger seed round early, spend on supply and demand acquisition together, and push fast city-wise expansion." -> "जल्दी larger seed round उठाएँ, supply और demand acquisition दोनों पर spend करें और city-wise expansion तेज़ करें।";
            case "Raise seed capital after early traction, hire product and growth leads quickly, and accelerate onboarding plus pricing experiments." -> "Early traction के बाद seed capital उठाएँ, product और growth leads जल्दी hire करें और onboarding plus pricing experiments तेज़ करें।";
            case "Choose one narrow user problem inside " -> "अंदर एक narrow user problem चुनें: ";
            case "Define the single workflow the MVP must solve for " -> "उस एक workflow को define करें जिसे MVP को solve करना है: ";
            case "Pick one narrow customer segment already managing " -> "ऐसा एक narrow customer segment चुनें जो पहले से manage कर रहा है ";
            case " manually" -> " manually";
            case "Identify the clearest revenue event inside " -> "अंदर सबसे clear revenue event identify करें: ";
            case "Review sector-specific compliance if " -> "अगर ";
            case " touches payments or sensitive data" -> " payments या sensitive data को touch करता है, तो sector-specific compliance review करें";
            case "Prioritize one painful use case inside " -> "अंदर एक painful use case को prioritize करें: ";
            default -> english;
        };
    }

    private String formatRangeLakhs(int minAmount, int maxAmount) {
        return "₹" + toLakhs(minAmount) + "L – ₹" + toLakhs(maxAmount) + "L";
    }

    private String toLakhs(int amount) {
        double lakhs = amount / 100000.0d;
        if (lakhs >= 10 || lakhs == Math.floor(lakhs)) {
            return String.valueOf((int) Math.round(lakhs));
        }
        return String.format(java.util.Locale.US, "%.1f", lakhs);
    }

    private record BudgetInputs(
            int developmentMin,
            int developmentMax,
            int teamMonthlyMin,
            int teamMonthlyMax,
            int opsMonthlyMin,
            int opsMonthlyMax,
            int breakEvenMinMonths,
            int breakEvenMaxMonths
    ) {
    }

    public record AgentOutputs(String legal, String finance, String execution, String market) {
    }
}
