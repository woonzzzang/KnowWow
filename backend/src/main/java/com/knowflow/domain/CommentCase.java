package com.knowflow.domain;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CommentCase(
        @JsonProperty("case_id") String caseId,
        @JsonProperty("project_id") String projectId,
        @JsonProperty("vessel_type") String vesselType,
        @JsonProperty("employee_id") String employeeId,
        @JsonProperty("comment_text") String commentText,
        @JsonProperty("response_text") String responseText,
        @JsonProperty("issue_type") String issueType,
        String equipment,
        String system,
        CaseContext context,
        String action,
        String outcome,
        @JsonProperty("created_at") LocalDate createdAt
) {
}

