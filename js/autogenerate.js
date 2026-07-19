

function updateGeneratorOptions() {
    const letters = document.getElementById("gen-type-letters").checked;

    document
        .getElementById("letter-options")
        .classList.toggle("hidden", !letters);

    document
        .getElementById("number-options")
        .classList.toggle("hidden", letters);
}

function toggleAutoPanel() {
    const panel = document.getElementById("autoPanel");

    if (panel.classList.contains("hidden")) {
        openAutoPanel();
    } else {
        closeAutoPanel();
    }
}

function openAutoPanel() {

    const panel = document.getElementById("autoPanel");

    // Pre-select the toggle to match whatever is currently in the
    // reference string field, so the visible state is always accurate.
    const mode = detectMode(
        document.getElementById("refstr").value
    );

    document.getElementById(
        mode === "char"
            ? "gen-type-letters"
            : "gen-type-numbers"
    ).checked = true;

    updateGeneratorOptions();

    panel.classList.remove("hidden");

    requestAnimationFrame(() => {
        panel.classList.add("panel-open");
    });
}

function closeAutoPanel() {

    const panel = document.getElementById("autoPanel");

    panel.classList.remove("panel-open");

    setTimeout(() => {
        panel.classList.add("hidden");
    }, 200);
}

function doGenerate() {

    const count = Math.max(
        1,
        Math.min(
            100,
            parseInt(document.getElementById("gen-count").value) || 20
        )
    );

    const useLetters =
        document.getElementById("gen-type-letters").checked;

    const generated = [];

    if (useLetters) {

        const totalLetters = Math.max(
            1,
            Math.min(
                26,
                parseInt(document.getElementById("gen-letter-count").value) || 5
            )
        );

        const alphabet =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                .slice(0, totalLetters)
                .split("");

        for (let i = 0; i < count; i++) {
            generated.push(
                alphabet[Math.floor(Math.random() * alphabet.length)]
            );
        }

    } else {

        const maxNumber = Math.max(
            1,
            parseInt(document.getElementById("gen-max-number").value) || 9
        );

        for (let i = 0; i < count; i++) {
            generated.push(
                Math.floor(Math.random() * (maxNumber + 1))
            );
        }

    }

    const input = document.getElementById("refstr");

    input.value = generated.join(" ");

    updateModeBadge(
        useLetters ? "char" : "num"
    );

    clearError();

    closeAutoPanel();

    input.style.borderColor = "#8b5cf6";
    input.style.boxShadow = "0 0 0 4px rgba(139,92,246,.25)";

    setTimeout(() => {
        input.style.borderColor = "";
        input.style.boxShadow = "";
    }, 800);

}

/* ══ WIRE UP GENERATOR CONTROLS ═════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

    document
        .getElementById("gen-type-numbers")
        .addEventListener("change", updateGeneratorOptions);

    document
        .getElementById("gen-type-letters")
        .addEventListener("change", updateGeneratorOptions);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeAutoPanel();
    });

    // Close auto panel when clicking outside of it
    document.addEventListener('click', e => {
        const panel = document.getElementById('autoPanel');
        const btn   = document.getElementById('autoBtn');
        if (panel && !panel.classList.contains('hidden') &&
            !panel.contains(e.target) && !btn.contains(e.target)) {
            closeAutoPanel();
        }
    });

});
