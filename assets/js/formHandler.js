// Function to parse the form data into a structured object
function parseFormData(formData) {
    const data = {};

    function setValue(obj, keys, value, isCheckbox = false) {
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let isArrayIndex = key.match(/^\d+$/) !== null;

            if (isArrayIndex) {
                key = parseInt(key); // Convert key to an integer for array access
                if (!Array.isArray(obj)) {
                    obj = []; // Ensure the object is treated as an array
                }
                if (obj.length <= key) {
                    obj[key] = {}; // Add a new object only if the index is at the end of the array
                }
            } else if (!obj[key]) {
                obj[key] = (keys[i + 1] && keys[i + 1].match(/^\d+$/)) ? [] : {};
            }

            if (i === keys.length - 1) {
                obj[key] = isCheckbox ? value === "on" : (value === "true" ? true : (value === "false" ? false : value));
            } else {
                obj = obj[key];
            }
        }
    }

    for (const [key, value] of formData.entries()) {
        const isCheckbox = key.endsWith("[required]"); // Assuming 'required' fields are checkboxes
        const keys = key.split(/[\[\].]+/).filter(k => k);
        setValue(data, keys, value, isCheckbox);
    }

    return data;
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('json-form');
    const responsesContainer = document.getElementById('responses-container');
    const addResponseButton = document.getElementById('add-response');
    const jsonOutput = document.getElementById('json-output');

	// Function to add nested properties
	function addNestedProperties(container, type, namePrefix = '') {
    // Count only elements with the '.property' class
    const propertyDivs = container.querySelectorAll('.property');
    const propertyIndex = propertyDivs.length;

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'property'; // Add 'property' class to fieldset for correct indexing
    const legend = document.createElement('legend');
    legend.textContent = `Property ${propertyIndex}`;
    fieldset.appendChild(legend);

    const propertyName = `${namePrefix}properties[${propertyIndex}]`;
    const propertyHtml = `
        <input type="text" name="${propertyName}[title]" placeholder="Title" />
        <select name="${propertyName}[type]">
            <option value="string">String</option>
            <option value="integer">Integer</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
        </select><br>
        <input type="checkbox" name="${propertyName}[required]"> Required<br>
    `;

    fieldset.innerHTML += propertyHtml;

    // Add a remove button for each nested property
    const removePropertyButton = document.createElement('button');
    removePropertyButton.textContent = 'Remove Property';
    removePropertyButton.type = 'button';
    removePropertyButton.onclick = function() {
        container.removeChild(fieldset);
    };
    fieldset.appendChild(removePropertyButton);

    // Add nested properties for objects and arrays
    if (type === 'object' || type === 'array') {
        const nestedContainer = document.createElement('div');
        nestedContainer.className = 'nested-properties';
        const addNestedButton = document.createElement('button');
        addNestedButton.textContent = type === 'object' ? 'Add Nested Property' : 'Add Array Item';
        addNestedButton.type = 'button';
        addNestedButton.onclick = () => addNestedProperties(nestedContainer, type === 'object' ? 'string' : 'array', `${propertyName}[properties]`);
        fieldset.appendChild(addNestedButton);
        fieldset.appendChild(nestedContainer);
    }

    container.appendChild(fieldset);
}

	 // Function to process and collect data from nested properties
    function processNestedProperties(container) {
    const properties = [];
    const propertyDivs = container.getElementsByClassName('property');
    for (const div of propertyDivs) {
        const titleInput = div.querySelector('input[name="title"]');
        const title = titleInput ? titleInput.value : '';

        const typeSelect = div.querySelector('select[name="type"]');
        const type = typeSelect ? typeSelect.value : '';

        const requiredCheckbox = div.querySelector('input[name="required"]');
        const required = requiredCheckbox ? requiredCheckbox.checked : false;

        const property = { title, type, required };

        // Check for further nested properties
        if ((type === 'object' || type === 'array') && div.querySelector('.nested-properties')) {
            const nestedContainer = div.querySelector('.nested-properties');
            property.properties = processNestedProperties(nestedContainer);
        }

        properties.push(property);
    }
    return properties;
}

    // Function to add a new response section
	function addResponse() {
    const responseIndex = responsesContainer.children.length;
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = `Response ${responseIndex + 1}`;
    fieldset.appendChild(legend);

    fieldset.innerHTML += `
        <input type="text" name="responses[${responseIndex}].status" placeholder="Status" /><br>
        <input type="number" name="responses[${responseIndex}].httpCode" placeholder="HTTP Code" /><br>
        <input type="text" name="responses[${responseIndex}].httpMessage" placeholder="HTTP Message" /><br>
        <input type="text" name="responses[${responseIndex}].statusDescription" placeholder="Status Description" /><br>
    `;

    // Button to add schema properties
    const addSchemaButton = document.createElement('button');
    addSchemaButton.textContent = 'Add Schema Property';
    addSchemaButton.type = 'button';
    addSchemaButton.onclick = function() {
        addNestedProperties(fieldset, 'object', `responses[${responseIndex}].`);
    };
    fieldset.appendChild(addSchemaButton);

    // Add a remove button for each response section
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove Response';
    removeButton.type = 'button';
    removeButton.onclick = function() {
        responsesContainer.removeChild(fieldset);
    };

    fieldset.appendChild(removeButton);
    responsesContainer.appendChild(fieldset);
}



    // Event listener for the Add Response button
    addResponseButton?.addEventListener('click', addResponse);

    // Function to handle form submission
    form.onsubmit = function(event) {
        event.preventDefault();

        const formData = new FormData(form);
        const data = parseFormData(formData);

        // Display the generated JSON
        jsonOutput.textContent = JSON.stringify(data, null, 2);
    };
});