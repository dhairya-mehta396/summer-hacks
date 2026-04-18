import React, { useMemo, useState } from "react";

const DEFAULT_STATUSES = ["done", "active", "active", "locked", "locked"];

const STEP_DEFINITIONS = [
    {
        title: "Ideation & Context",
        icon: "I",
        category: "Foundation",
        description: "Pin down the startup narrative, user problem, and operating context before execution starts.",
        items: [
            "Define the customer pain point and urgency",
            "Summarize the startup thesis in one sentence",
            "Document niche constraints and assumptions",
            "Confirm the primary user and buying trigger"
        ]
    },
    {
        title: "Market Triage",
        icon: "M",
        category: "Market",
        description: "Pressure-test demand, alternatives, and early positioning so the roadmap stays commercially grounded.",
        items: [
            "Identify direct and adjacent competitors",
            "Map target segments by willingness to pay",
            "Validate demand signals from customer channels",
            "Write a crisp differentiation statement"
        ]
    },
    {
        title: "Financial Structuring",
        icon: "F",
        category: "Finance",
        description: "Set the commercial model, revenue targets, and operating assumptions needed for disciplined growth.",
        items: [
            "Choose an initial pricing approach",
            "Model revenue milestones against the goal",
            "Estimate fixed and variable startup costs",
            "Define core unit economics assumptions"
        ]
    },
    {
        title: "Legal Hardening",
        icon: "L",
        category: "Compliance",
        description: "Prepare legal structure, risk controls, and documentation before moving into go-to-market execution.",
        items: [
            "Select the formation and ownership structure",
            "List required policies and disclosures",
            "Review contract, IP, and data risks",
            "Set a compliance checklist for launch"
        ]
    },
    {
        title: "GTM Launch",
        icon: "G",
        category: "Launch",
        description: "Coordinate messaging, channels, and launch milestones for a disciplined market entry.",
        items: [
            "Define the launch channel mix",
            "Draft the first acquisition experiments",
            "Prepare launch messaging and landing assets",
            "Set weekly conversion and activation targets"
        ]
    }
];

const STATUS_META = {
    done: {
        pillLabel: "Verified",
        pillBackground: "#DFF7EC",
        pillText: "#0B6B4D",
        accent: "#16A56F",
        progress: "#16A56F",
        nodeBorder: "#B7E9D3",
        panelTint: "#F3FBF7"
    },
    active: {
        pillLabel: "In Progress",
        pillBackground: "#E7EEFF",
        pillText: "#315EE8",
        accent: "#315EE8",
        progress: "#315EE8",
        nodeBorder: "#CFD8FF",
        panelTint: "#F6F8FF"
    },
    locked: {
        pillLabel: "Locked",
        pillBackground: "#F3F4F6",
        pillText: "#6B7280",
        accent: "#9CA3AF",
        progress: "#9CA3AF",
        nodeBorder: "#E5E7EB",
        panelTint: "#FAFAFA"
    }
};

const createInitialItems = (statuses) =>
    STEP_DEFINITIONS.map((step, index) =>
        step.items.map(() => (statuses[index] || DEFAULT_STATUSES[index]) === "done")
    );

const StartupRoadmap = ({
    vaultContext = { niche: "", targetAudience: "", revenueGoal: "" },
    initialStepStatuses = DEFAULT_STATUSES
}) => {
    const [activeStep, setActiveStep] = useState(1);
    const [stepItems, setStepItems] = useState(() => createInitialItems(initialStepStatuses));
    const [isGenerating, setIsGenerating] = useState(false);

    const steps = useMemo(
        () =>
            STEP_DEFINITIONS.map((step, index) => ({
                ...step,
                status: initialStepStatuses[index] || DEFAULT_STATUSES[index]
            })),
        [initialStepStatuses]
    );

    const currentStep = steps[activeStep];
    const currentItems = stepItems[activeStep] || [];
    const completedCount = currentItems.filter(Boolean).length;
    const completionPercent = Math.round((completedCount / currentStep.items.length) * 100);
    const currentStatusMeta = STATUS_META[currentStep.status];

    const handleStepClick = (index) => {
        if (steps[index].status === "locked") {
            return;
        }

        setActiveStep(index);
    };

    const handleChecklistToggle = (stepIndex, itemIndex) => {
        setStepItems((prev) =>
            prev.map((items, currentStepIndex) =>
                currentStepIndex === stepIndex
                    ? items.map((isChecked, currentItemIndex) =>
                        currentItemIndex === itemIndex ? !isChecked : isChecked
                    )
                    : items
            )
        );
    };

    const handleGenerate = async () => {
        setIsGenerating(true);

        try {
            await fetch("/api/roadmap/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    stepName: currentStep.title,
                    niche: vaultContext.niche,
                    targetAudience: vaultContext.targetAudience,
                    revenueGoal: vaultContext.revenueGoal
                })
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div
            style={{
                "--roadmap-border": "#DADCE5",
                "--roadmap-text": "#13151A",
                "--roadmap-muted": "#667085",
                "--roadmap-surface": "#FFFFFF",
                "--roadmap-surface-soft": "#F7F8FC",
                "--roadmap-peach": "#FFE9DE",
                "--roadmap-blue": "#EAF0FF",
                "--roadmap-lime": "#EAF7DB",
                width: "100%",
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
                color: "var(--roadmap-text)"
            }}
        >
            <div
                style={{
                    width: "100%",
                    padding: "22px 22px 26px",
                    border: "1px solid var(--roadmap-border)",
                    background: "var(--roadmap-surface)",
                    overflowX: "auto",
                    borderRadius: 28
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                        marginBottom: 18
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                borderRadius: 999,
                                padding: "7px 12px",
                                background: "var(--roadmap-surface-soft)",
                                border: "1px solid var(--roadmap-border)",
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase"
                            }}
                        >
                            Startup Roadmap
                        </div>
                        <div style={{ marginTop: 12, fontSize: 24, fontWeight: 750, letterSpacing: "-0.03em" }}>
                            Build the company in stages, not chaos.
                        </div>
                    </div>
                    <div
                        style={{
                            borderRadius: 18,
                            padding: "12px 14px",
                            background: "var(--roadmap-blue)",
                            border: "1px solid #D6DFFF",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#3856B8"
                        }}
                    >
                        Tap any open stage to focus the workstream.
                    </div>
                </div>
                <div
                    style={{
                        minWidth: 860,
                        display: "grid",
                        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                        alignItems: "start",
                        gap: 18,
                        position: "relative"
                    }}
                >
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: 70,
                            right: 70,
                            top: 72,
                            height: 1,
                            background: "#CDD3E1"
                        }}
                    />
                    {steps.map((step, index) => {
                        const isLocked = step.status === "locked";
                        const isSelected = index === activeStep;
                        const statusMeta = STATUS_META[step.status];

                        return (
                            <button
                                key={step.title}
                                type="button"
                                onClick={() => handleStepClick(index)}
                                disabled={isLocked}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "18px 14px 16px",
                                    border: `1px solid ${isSelected ? statusMeta.accent : "var(--roadmap-border)"}`,
                                    background: isSelected ? statusMeta.panelTint : "var(--roadmap-surface-soft)",
                                    borderRadius: 24,
                                    opacity: isLocked ? 0.5 : 1,
                                    cursor: isLocked ? "default" : "pointer",
                                    textAlign: "center",
                                    transform: isSelected ? "translateY(-4px)" : "translateY(0)",
                                    transition: "transform 160ms ease, background 160ms ease, border-color 160ms ease"
                                }}
                            >
                                <div
                                    style={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: "50%",
                                        border: `1px solid ${isSelected ? statusMeta.accent : statusMeta.nodeBorder}`,
                                        background: isSelected ? "#FFFFFF" : statusMeta.panelTint,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: statusMeta.accent,
                                        fontSize: 18,
                                        fontWeight: 700,
                                        position: "relative",
                                        zIndex: 1
                                    }}
                                >
                                    {step.icon}
                                </div>
                                <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--roadmap-muted)", textTransform: "uppercase" }}>
                                    Step {index + 1}
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35, maxWidth: 150, letterSpacing: "-0.02em" }}>
                                    {step.title}
                                </div>
                                <div
                                    style={{
                                        borderRadius: 999,
                                        padding: "7px 11px",
                                        background: statusMeta.pillBackground,
                                        color: statusMeta.pillText,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        lineHeight: 1
                                    }}
                                >
                                    {statusMeta.pillLabel}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div
                style={{
                    marginTop: 16,
                    border: "1px solid var(--roadmap-border)",
                    background: "var(--roadmap-surface)",
                    padding: 24,
                    borderRadius: 28,
                    position: "relative",
                    overflow: "hidden"
                }}
            >
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: -40,
                        right: -20,
                        width: 180,
                        height: 180,
                        borderRadius: "50%",
                        background: currentStep.status === "done" ? "var(--roadmap-lime)" : "var(--roadmap-peach)",
                        opacity: 0.7
                    }}
                />
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                        flexWrap: "wrap",
                        position: "relative"
                    }}
                >
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", minWidth: 0, flex: "1 1 420px" }}>
                        <div
                            style={{
                                width: 54,
                                height: 54,
                                borderRadius: 18,
                                border: `1px solid ${currentStatusMeta.nodeBorder}`,
                                background: currentStatusMeta.panelTint,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: currentStatusMeta.accent,
                                fontSize: 18,
                                fontWeight: 700,
                                flexShrink: 0
                            }}
                        >
                            {currentStep.icon}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    borderRadius: 999,
                                    padding: "6px 10px",
                                    background: "#F4F5F8",
                                    border: "1px solid var(--roadmap-border)",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase"
                                }}
                            >
                                {currentStep.category}
                            </div>
                            <div style={{ marginTop: 10, fontSize: 28, fontWeight: 780, lineHeight: 1.05, letterSpacing: "-0.04em" }}>
                                {currentStep.title}
                            </div>
                            <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.6, color: "var(--roadmap-muted)", maxWidth: 720 }}>
                                {currentStep.description}
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            minWidth: 120,
                            borderRadius: 22,
                            padding: "14px 16px",
                            background: "#F8FAFC",
                            border: "1px solid var(--roadmap-border)"
                        }}
                    >
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--roadmap-muted)" }}>
                            Completion
                        </div>
                        <div style={{ marginTop: 8, fontSize: 32, fontWeight: 800, color: currentStatusMeta.accent, lineHeight: 1, letterSpacing: "-0.05em" }}>
                            {completionPercent}%
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        marginTop: 22,
                        height: 10,
                        width: "100%",
                        background: "#EEF1F6",
                        overflow: "hidden",
                        borderRadius: 999,
                        position: "relative"
                    }}
                >
                    <div
                        style={{
                            width: `${completionPercent}%`,
                            height: "100%",
                            background: currentStatusMeta.progress,
                            transition: "width 180ms ease",
                            borderRadius: 999
                        }}
                    />
                </div>

                <div
                    style={{
                        marginTop: 12,
                        fontSize: 13,
                        color: "var(--roadmap-muted)",
                        fontWeight: 600
                    }}
                >
                    Turn boxes on and off as you complete work for this stage.
                </div>

                <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
                    {currentStep.items.map((item, itemIndex) => {
                        const isChecked = currentItems[itemIndex];

                        return (
                            <button
                                key={item}
                                type="button"
                                onClick={() => handleChecklistToggle(activeStep, itemIndex)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "14px 16px",
                                    border: `1px solid ${isChecked ? currentStatusMeta.nodeBorder : "var(--roadmap-border)"}`,
                                    borderRadius: 18,
                                    background: isChecked ? currentStatusMeta.panelTint : "#FFFFFF",
                                    cursor: "pointer",
                                    textAlign: "left"
                                }}
                            >
                                <span
                                    aria-hidden="true"
                                    style={{
                                        width: 22,
                                        height: 22,
                                        border: `1px solid ${isChecked ? currentStatusMeta.accent : "#C7CDD4"}`,
                                        background: isChecked ? currentStatusMeta.progress : "#FFFFFF",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#FFFFFF",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                        borderRadius: 7
                                    }}
                                >
                                    {isChecked ? "✓" : ""}
                                </span>
                                <span
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 600,
                                        color: isChecked ? "var(--roadmap-muted)" : "var(--roadmap-text)",
                                        textDecoration: isChecked ? "line-through" : "none",
                                        lineHeight: 1.5
                                    }}
                                >
                                    {item}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div
                    style={{
                        marginTop: 22,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "wrap"
                    }}
                >
                    <div
                        style={{
                            borderRadius: 999,
                            padding: "9px 14px",
                            background: currentStatusMeta.panelTint,
                            border: `1px solid ${currentStatusMeta.nodeBorder}`,
                            fontSize: 12,
                            fontWeight: 700,
                            color: currentStatusMeta.pillText
                        }}
                    >
                        {currentStep.category} Track
                    </div>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        style={{
                            border: "1px solid #1F2937",
                            background: isGenerating ? "#DDE5FF" : "#111827",
                            color: isGenerating ? "#2743B5" : "#FFFFFF",
                            padding: "12px 18px",
                            fontSize: 13,
                            fontWeight: 750,
                            cursor: isGenerating ? "wait" : "pointer",
                            borderRadius: 16,
                            letterSpacing: "-0.01em"
                        }}
                    >
                        {isGenerating ? "Generating..." : "Generate with AI"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StartupRoadmap;
