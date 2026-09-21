package com.knowflow.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PatternSignature(
        @JsonProperty("issue_type") String issueType,
        String equipment,
        String system,
        @JsonProperty("material_status") String materialStatus,
        @JsonProperty("drawing_status") String drawingStatus
) {
    public static PatternSignature from(CommentCase item) {
        return new PatternSignature(
                item.issueType(),
                item.equipment(),
                item.system(),
                item.context().materialStatus(),
                item.context().drawingStatus()
        );
    }
}

