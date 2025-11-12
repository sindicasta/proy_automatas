package com.proy.automatas.dto;

import lombok.Data;

// @Data de Lombok genera getters, setters, etc.
@Data
public class ValidateRequest {
    private String text;
    private String validationType; // "NUMERIC", "IDENTIFIER", "UPPERCASE"
}