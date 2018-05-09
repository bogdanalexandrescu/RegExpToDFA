window.onload = function() {
    const button = document.getElementById('button');

    button.addEventListener('click', showGraph);
};

/**
 * Build and show the DFA in the container
 */
function showGraph() {
    const container = document.getElementById('container');
    const input = document.getElementById('input');
    const inputValue = input.value.trim();

    if (inputValue) {
        const builder = new DFABuilder(input.value);
        builder.build();

        container.innerHTML = Viz(builder.DOTScript);
    }
}
