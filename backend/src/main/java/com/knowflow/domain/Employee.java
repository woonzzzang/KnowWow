package com.knowflow.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

public record Employee(
        @JsonProperty("employee_id") String employeeId,
        String name,
        String department,
        @JsonProperty("experience_level") String experienceLevel,
        @JsonProperty("experience_years") int experienceYears
) {
}

