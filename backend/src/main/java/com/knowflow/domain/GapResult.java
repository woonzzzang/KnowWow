package com.knowflow.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GapResult(
        @JsonProperty("case_id") String caseId,
        String status,
        @JsonProperty("requires_interview") boolean requiresInterview,
        @JsonProperty("current_action") String currentAction,
        @JsonProperty("majority_action") String majorityAction,
        @JsonProperty("pattern_id") String patternId,
        String reason
) {
    public static GapResult noPattern(CommentCase item) {
        return new GapResult(item.caseId(), "NO_PATTERN", false, item.action(), null, null,
                "비교할 수 있는 관찰 패턴이 없습니다.");
    }

    public static GapResult none(CommentCase item, OrganizationPattern pattern) {
        return new GapResult(item.caseId(), "NONE", false, item.action(), pattern.majorityAction(),
                pattern.patternId(), "현재 처리는 관찰된 패턴 범위 안에 있습니다.");
    }

    public static GapResult actionVariant(CommentCase item, OrganizationPattern pattern) {
        return new GapResult(item.caseId(), "ACTION_VARIANT", true, item.action(), pattern.majorityAction(),
                pattern.patternId(), "안정적인 패턴과 다른 처리가 관찰되어 판단 조건 확인이 필요합니다.");
    }
}

