package com.proy.automatas.service;

import org.springframework.stereotype.Service;

@Service // Le dice a Spring que esta clase es un Servicio
public class LexerService {

    // Usamos un 'enum' para que los estados sean legibles
    private enum State {
        Q0, // Estado inicial
        Q1, // Estado intermedio
        Q2, // Estado de Aceptación (final)
        QE  // Estado de Error (muerto)
    }

    /**
     * Método público que elige qué autómata usar
     */
    public boolean validate(String text, String type) {
        // Regla: "los espacios no serán tomados en cuenta"
        String processedText = text.replaceAll("\\s+", "");

        switch (type.toUpperCase()) {
            case "NUMERIC":
                return runDfaNumeric(processedText);
            case "IDENTIFIER":
                return runDfaIdentifier(processedText);
            case "UPPERCASE":
                return runDfaUppercase(processedText);
            default:
                return false; // Tipo de validación no reconocido
        }
    }

    // --- IMPLEMENTACIÓN DE LOS AUTÓMATAS ---

    /**
     * AFD para Cadenas Numéricas: [0-9]+.
     */
    private boolean runDfaNumeric(String text) {
        State currentState = State.Q0;

        for (char c : text.toCharArray()) {
            switch (currentState) {
                case Q0: // Estado inicial
                    if (Character.isDigit(c)) currentState = State.Q1;
                    else currentState = State.QE;
                    break;
                case Q1: // Estado "En_Digitos"
                    if (Character.isDigit(c)) currentState = State.Q1; // Bucle en q1
                    else if (c == '.') currentState = State.Q2;        // Aceptación
                    else currentState = State.QE;
                    break;
                case Q2: // Estado final
                    currentState = State.QE; // No debe llegar nada después del '.'
                    break;
                case QE: // Estado de error
                    return false; // Salida rápida
            }
        }
        // La cadena es válida SOLO si terminamos en el estado de aceptación
        return currentState == State.Q2;
    }

    /**
     * AFD para Identificadores: [a-zA-Z_][a-zA-Z0-9_]*.
     */
    private boolean runDfaIdentifier(String text) {
        State currentState = State.Q0;

        for (char c : text.toCharArray()) {
            switch (currentState) {
                case Q0:
                    if (Character.isLetter(c) || c == '_') currentState = State.Q1;
                    else currentState = State.QE;
                    break;
                case Q1:
                    if (Character.isLetterOrDigit(c) || c == '_') currentState = State.Q1;
                    else if (c == '.') currentState = State.Q2;
                    else currentState = State.QE;
                    break;
                case Q2:
                    currentState = State.QE; // Nada después del '.'
                    break;
                case QE:
                    return false;
            }
        }
        return currentState == State.Q2;
    }

    /**
     * AFD para Inicia con Mayúscula: [A-Z][a-zA-Z0-9]*.
     */
    private boolean runDfaUppercase(String text) {
        State currentState = State.Q0;

        for (char c : text.toCharArray()) {
            switch (currentState) {
                case Q0:
                    if (Character.isUpperCase(c)) currentState = State.Q1;
                    else currentState = State.QE;
                    break;
                case Q1:
                    if (Character.isLetterOrDigit(c)) currentState = State.Q1;
                    else if (c == '.') currentState = State.Q2;
                    else currentState = State.QE;
                    break;
                case Q2:
                    currentState = State.QE; // Nada después del '.'
                    break;
                case QE:
                    return false;
            }
        }
        return currentState == State.Q2;
    }
}