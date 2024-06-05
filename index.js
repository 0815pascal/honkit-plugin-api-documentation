const fs = require("fs");
const Handlebars = require("handlebars");
const path = require("path");
const { getMethod, getParameters, getResponses } = require("./helpers");

// Read and compile the template
const templateSource = fs.readFileSync(path.join(__dirname, "_layouts", "dynamic_template.hbs"), "utf8");

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
          const nestedProperties = Handlebars.helpers.renderProperties(property.properties, options);
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
          const nestedProperties = Handlebars.helpers.renderProperties(property.items.properties, options);
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
        const markerContent = content.substring(start + markerStart.length, end);

        let data;
        try {
          console.log(markerContent.trim());
          data = JSON.parse(markerContent.trim());
        } catch (error) {
          console.error("Error parsing JSON for dynamic template:", error);
          return page;
        }

        // Get all keys of the 'paths' object
        const keys = Object.keys(data.paths);

        // Get the first key from the keys array
        const firstKey = keys[0];

        const parameters = getParameters(data, firstKey);
        const responses = getResponses(data, firstKey);

        const { name = "", required, type, maxLength, schema = "" } = parameters || {};

        const { info, schemes, host, basePath, paths } = data;
        const { description, title } = info;
        const path = Object.keys(paths ?? {})[0];
        const paramName = `${parameters?.name}`;
        console.log("gugus", schema);

        const dynamicContent = template({
          apiTitle: title,
          method: getMethod(data, "/{input}"),
          baseUrl: schemes[0] + "://" + host + basePath,
          path: path === "/" ? "" : `${path.replace("/", "")}`,
          description: description,
          paramName: paramName,
          required: required ? "*" : "",
          type: type,
          paramDescription: maxLength ? `max. length: ${maxLength}` : "--",
          requestBody: schema,
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
