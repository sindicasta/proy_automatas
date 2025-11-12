// Espera a que todo el HTML esté cargado
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Obtenemos los elementos del formulario
    const form = document.getElementById("validationForm");
    const textInput = document.getElementById("textToValidate");
    const typeSelect = document.getElementById("validationType");
    const resultBox = document.getElementById("resultBox");

    // 2. Escuchamos el evento "submit" del formulario
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Evita que la página se recargue

        // 3. Obtenemos los valores del usuario
        const text = textInput.value;
        const type = typeSelect.value;

        // 4. Preparamos el objeto JSON que nuestra API espera
        const dataToSend = {
            text: text,
            validationType: type
        };

        try {
            // 5. ¡Llamamos a nuestra API de Spring Boot!
            const response = await fetch("/api/v1/validate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dataToSend)
            });

            // 6. Convertimos la respuesta de JSON a un objeto
            const result = await response.json();

            // 7. Mostramos el resultado en pantalla
            displayResult(result);

        } catch (error) {
            console.error("Error al llamar a la API:", error);
            resultBox.textContent = "Error: No se pudo conectar al servidor.";
            resultBox.className = "error";
        }
    });

    // Función para mostrar el resultado
    function displayResult(result) {
        resultBox.textContent = result.message;
        if (result.isValid) {
            resultBox.className = "success"; // Aplica el CSS verde
        } else {
            resultBox.className = "error";   // Aplica el CSS rojo
        }
    }
});