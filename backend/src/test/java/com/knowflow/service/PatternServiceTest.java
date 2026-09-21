package com.knowflow.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.knowflow.domain.GapResult;

class PatternServiceTest {
    private DataStoreService dataStore;
    private PatternService patternService;

    @BeforeEach
    void setUp() throws Exception {
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        Path data = Path.of("../data").toAbsolutePath().normalize();
        dataStore = new DataStoreService(mapper, data.toString());
        dataStore.load();
        patternService = new PatternService(dataStore);
    }

    @Test
    void minesFourStablePatternsFromTheDesignedDataset() {
        assertThat(patternService.patterns()).hasSize(4).allMatch(pattern -> pattern.stable());
    }

    @Test
    void detectsTheMainDemoCaseAsAnActionVariant() {
        var item = dataStore.requireCase("CASE-008");
        var pattern = patternService.patternFor(item).orElseThrow();
        GapResult gap = patternService.gapFor(item);

        assertThat(pattern.supportCount()).isEqualTo(8);
        assertThat(pattern.actionDistribution())
                .containsEntry("TRANSFER_TO_PRODUCTION", 6L)
                .containsEntry("SITE_CHECK_THEN_TRANSFER", 1L)
                .containsEntry("DRAWING_REVISION", 1L);
        assertThat(pattern.majorityRatio()).isEqualTo(0.75);
        assertThat(gap.status()).isEqualTo("ACTION_VARIANT");
        assertThat(gap.requiresInterview()).isTrue();
    }

    @Test
    void doesNotInterviewAConformingCase() {
        GapResult gap = patternService.gapFor(dataStore.requireCase("CASE-001"));
        assertThat(gap.status()).isEqualTo("NONE");
        assertThat(gap.requiresInterview()).isFalse();
    }

    @Test
    void exposesAtLeastThreeDesignedActionVariants() {
        long variants = dataStore.cases().stream()
                .map(patternService::gapFor)
                .filter(GapResult::requiresInterview)
                .count();
        assertThat(variants).isGreaterThanOrEqualTo(3);
    }
}

