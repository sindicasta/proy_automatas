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

@RestController // Le dice a Spring que esta clase es un Controlador REST
@RequestMapping("/api/v1") // Todas las URLs de esta clase empezarán con /api/v1
public class ValidationController {

    @Autowired // Inyecta el servicio que creamos
    private LexerService lexerService;

    @PostMapping("/validate") // La URL completa será POST /api/v1/validate
    public ResponseEntity<ValidateResponse> validateString(@RequestBody ValidateRequest request) {

        // Limpiamos el texto (aquí o en el servicio)
        String processedText = request.getText().replaceAll("\\s+", "");
        
        // 1. Usamos el servicio para validar
        boolean isValid = lexerService.validate(request.getText(), request.getValidationType());

        // 2. Creamos el mensaje de respuesta
        String message = isValid ? 
            "Cadena ACEPTADA para el tipo " + request.getValidationType() :
            "Cadena RECHAZADA para el tipo " + request.getValidationType();

        // 3. Enviamos la respuesta (Spring lo convierte a JSON)
        ValidateResponse response = new ValidateResponse(isValid, message, processedText);
        return ResponseEntity.ok(response);
    }
}