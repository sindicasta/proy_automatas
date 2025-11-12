package com.proy.automatas.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor // Genera un constructor con todos los campos
public class ValidateResponse {
    private boolean isValid;
    private String message;
    private String processedText; // El texto ya sin espacios
}