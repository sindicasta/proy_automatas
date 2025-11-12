package com.proy.automatas.controller;

import com.proy.automatas.dto.ValidateRequest;
import com.proy.automatas.dto.ValidateResponse;
import com.proy.automatas.service.LexerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// --- NUEVOS IMPORTS ---
import com.proy.automatas.dto.tree.TreeAnalysisRequest;
import com.proy.automatas.dto.tree.TreeAnalysisResponse;
import com.proy.automatas.service.TreeMethodService;
import org.springframework.http.HttpStatus;
import java.util.Map;

@RestController
@RequestMapping("/api/v1") // La URL base para nuestro controlador
public class ValidationController {

    @Autowired // Spring inyecta automáticamente nuestro servicio
    private LexerService lexerService;

    // --- NUEVO SERVICIO INYECTADO ---
    @Autowired
    private TreeMethodService treeMethodService;

    // --- ENDPOINT ORIGINAL ---
    @PostMapping("/validate")
    public ResponseEntity<ValidateResponse> validateString(@RequestBody ValidateRequest request) {
        String processedText = request.getText().replaceAll("\\s+", "");
        boolean isValid = lexerService.validate(request.getText(), request.getValidationType());
        String message = isValid ? 
            "Cadena ACEPTADA para el tipo " + request.getValidationType() :
            "Cadena RECHAZADA para el tipo " + request.getValidationType();
        ValidateResponse response = new ValidateResponse(isValid, message, processedText);
        return ResponseEntity.ok(response);
    }

    // --- NUEVO ENDPOINT PARA EL ÁRBOL ---
    @PostMapping("/build-tree")
    public ResponseEntity<?> buildTree(@RequestBody TreeAnalysisRequest request) {
        try {
            // Llama a nuestro nuevo servicio de Java
            TreeAnalysisResponse response = treeMethodService.analyzeRegex(request.getRegex());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            // Si algo falla (ej. expresión malformada)
            Map<String, String> error = Map.of("message", e.getMessage());
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(error);
        }
    }
}