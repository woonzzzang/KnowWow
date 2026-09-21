package com.knowflow.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CaseContext(
        @JsonProperty("material_status") String materialStatus,
        @JsonProperty("drawing_status") String drawingStatus,
        @JsonProperty("construction_stage") String constructionStage
) {
}

