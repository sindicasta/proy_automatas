// Espera a que todo el HTML esté cargado
document.addEventListener("DOMContentLoaded", () => {
    
    // --- LÓGICA ORIGINAL DEL VALIDADOR ---
    const form = document.getElementById("validationForm");
    const textInput = document.getElementById("textToValidate");
    const typeSelect = document.getElementById("validationType");
    const resultBox = document.getElementById("resultBox");

    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault(); // Evita que la página se recargue

            const text = textInput.value;
            const type = typeSelect.value;
            const dataToSend = {
                text: text,
                validationType: type
            };

            try {
                const response = await fetch("/api/v1/validate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dataToSend)
                });
                const result = await response.json();
                
                // Esta función aplica los colores
                displayResult(result); 
                
            } catch (error) {
                console.error("Error al llamar a la API:", error);
                resultBox.textContent = "Error: No se pudo conectar al servidor.";
                resultBox.className = "error"; // Clase roja si falla la conexión
            }
        });
    }

    /**
     * Esta es la función clave que cambia los colores.
     * Añade la clase 'success' (verde) o 'error' (rojo) al 'resultBox'
     * basado en la respuesta del backend.
     */
    function displayResult(result) {
        if (!resultBox) return;
        resultBox.textContent = result.message;
        
        if (result.isValid) {
            // ACEPTADO: Pone la clase 'success' (verde)
            resultBox.className = "success"; 
        } else {
            // RECHAZADO: Pone la clase 'error' (rojo)
            resultBox.className = "error";   
        }
    }

    // --- CÓDIGO PARA EL BOTÓN DE IR AL ÁRBOL ---
    const goToTreeBtn = document.getElementById('goToTreeBtn');
    
    if (goToTreeBtn && textInput) {
        goToTreeBtn.addEventListener('click', (event) => {
            event.preventDefault(); 
            
            const regex = textInput.value;
            const cleanRegex = regex.endsWith('.') ? regex.substring(0, regex.length - 1) : regex;
            
            localStorage.setItem('expresionParaArbol', cleanRegex);
            
            window.location.href = goToTreeBtn.href;
        });
    }
});