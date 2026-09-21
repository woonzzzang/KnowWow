package com.knowflow.domain;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OrganizationPattern(
        @JsonProperty("pattern_id") String patternId,
        PatternSignature signature,
        @JsonProperty("support_count") int supportCount,
        @JsonProperty("action_distribution") Map<String, Long> actionDistribution,
        @JsonProperty("majority_action") String majorityAction,
        @JsonProperty("majority_ratio") double majorityRatio,
        @JsonProperty("supporting_case_ids") List<String> supportingCaseIds,
        @JsonProperty("employee_ids") List<String> employeeIds,
        boolean stable
) {
}

