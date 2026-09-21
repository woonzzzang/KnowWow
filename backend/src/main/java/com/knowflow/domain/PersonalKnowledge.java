package com.knowflow.domain;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PersonalKnowledge(
        @JsonProperty("knowledge_id") String knowledgeId,
        @JsonProperty("employee_id") String employeeId,
        @JsonProperty("source_case_ids") List<String> sourceCaseIds,
        Trigger trigger,
        String question,
        @JsonProperty("raw_answer_text") String rawAnswerText,
        @JsonProperty("structured_knowledge") StructuredKnowledge structuredKnowledge,
        @JsonProperty("verified_by_user") boolean verifiedByUser,
        @JsonProperty("created_at") LocalDate createdAt
) {
    public record Trigger(String type, @JsonProperty("pattern_id") String patternId) {
    }

    public record NewContext(String name, String value) {
    }

    public record StructuredKnowledge(
            @JsonProperty("new_context") NewContext newContext,
            String action,
            String rationale,
            String exception
    ) {
    }
}

