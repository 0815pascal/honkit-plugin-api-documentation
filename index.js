const fs = require("fs");
const Handlebars = require("handlebars");
const path = require("path");
const { getMethod, getParameters, getResponses } = require("./helpers");

// Read and compile the template
const templateSource = fs.readFileSync(
  path.join(__dirname, "_layouts", "dynamic_template.hbs"),
  "utf8"
);

Handlebars.registerHelper("renderProperties", function (properties, options) {
  if (!properties || typeof properties !== "object") {
    return ""; // Early exit if not an object
  }

  const output = [];
  for (const key in properties) {
    const property = properties[key];
    const { required, type } = property;
    const escapedKey = Handlebars.Utils.escapeExpression(key);
    const escapedType = Handlebars.Utils.escapeExpression(property.type);
    const maxLength = property?.maxLength;
    const maxLengthStr = maxLength ? `(${maxLength})` : "";
    const requiredFlag = required ? '<span class="required">*</span>' : "";

    switch (type) {
      case "object":
        if (property?.properties) {
          const nestedProperties = Handlebars.helpers.renderProperties(
            property.properties,
            options
          );
          output.push(`
            <details>
              <summary>
                <span class="title">${escapedKey}${requiredFlag}</span>
                <span class="type">${escapedType}${maxLengthStr}</span>
              </summary>
              <div class="nested">${nestedProperties}</div>
            </details>
          `);
        }
        break;
      case "array":
        if (property?.items?.properties) {
          const maxItems = property?.maxItems;
          const maxItemsStr = maxItems ? `(${maxItems})` : "";
          const nestedProperties = Handlebars.helpers.renderProperties(
            property.items.properties,
            options
          );
          output.push(`
            <details>
              <summary>
                <span class="title">${escapedKey}${requiredFlag}</span>
                <span class="type">${escapedType}${maxItemsStr}</span>
              </summary>
              <div class="nested">${nestedProperties}</div>
            </details>
          `);
        }
        break;
      default:
        output.push(`
          <div>
            <p class="type">
              <span class="title">${escapedKey}${requiredFlag}</span>${escapedType}${maxLengthStr}
            </p>
          </div>
        `);
        break;
    }
  }

  return new Handlebars.SafeString(output.join(""));
});

const template = Handlebars.compile(templateSource);

module.exports = {
  book: {
    assets: "./assets",
    js: ["js/formHandler.js"],
    css: ["style.css"],
  },
  hooks: {
    init: function () {},
    "page:before": async function (page) {
      const markerStart = "<!-- API_START -->";
      const markerEnd = "<!-- API_END -->";
      let content = page.content;

      while (content.includes(markerStart)) {
        const start = content.indexOf(markerStart);
        const end = content.indexOf(markerEnd, start);

        if (end === -1) {
          return page;
        }

        const beforeMarker = content.substring(0, start);
        const afterMarker = content.substring(end + markerEnd.length);
        const markerContent = content.substring(
          start + markerStart.length,
          end
        );

        let data;
        try {
          console.log(markerContent.trim());
          data = JSON.parse(markerContent.trim());
        } catch (error) {
          console.error("Error parsing JSON for dynamic template:", error);
          return page;
        }

        const parameters = getParameters(data, "/{input}");
        const responses = getResponses(data, "/{input}");
        const { name, required, type, maxLength } = parameters;
        const { info, schemes, host, basePath } = data;
        const { description, title } = info;
        const paramName = `${parameters?.name}`;

        const dynamicContent = template({
          apiTitle: title,
          method: getMethod(data, "/{input}"),
          baseUrl: schemes[0] + "://" + host + basePath,
          path: name && `/{${name}}`,
          description: description,
          paramName: paramName,
          required: required ? "*" : "",
          type: type,
          paramDescription: maxLength ? `max. length: ${maxLength}` : "--",
          responses: data.responses ?? responses,
        });
        content = beforeMarker + dynamicContent + afterMarker;
      }

      page.content = content;
      return page;
    },
  },
  filters: {},
};
