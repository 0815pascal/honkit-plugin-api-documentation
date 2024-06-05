function getNonEmptyObject(obj) {
  // Check if the object is not null or undefined
  if (!obj) {
    return null;
  }

  // Check if the object has at least one own property
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      return obj; // Return the object as it is non-empty
    }
  }

  return null; // Return null if the object is empty
}

function tryPaths(data, firstKey) {
  const pathData = data.paths[firstKey];
  if (!pathData) {
    return data.paths["/"] ?? null;
  }
  return pathData;
}

function tryWithProperty(pathData, property) {
  console.log("respi", property, pathData?.post?.[property]);
  return pathData?.get?.[property] ?? pathData?.post?.[property] ?? pathData?.post?.[property] ?? null;
}

function getMethod(data, firstKey) {
  if (typeof data !== "object" || data === null) {
    throw new Error("data is not an object");
  }

  if (typeof firstKey !== "string") {
    throw new Error("Path must be a string");
  }

  if (!data?.paths) {
    return data;
  }

  const pathData = tryPaths(data, firstKey);
  if (!pathData) {
    return null;
  }

  const key = Object.keys(pathData).find((key) => pathData[key]);

  if (!key) {
    return null;
  }
  return key;
}

function transformObject(obj) {
  const responses = [];

  for (const [httpCode, details] of Object.entries(obj)) {
    let status, httpMessage;

    const code = parseInt(httpCode, 10);

    if (code >= 200 && code < 300) {
      status = "ok";
      httpMessage = "OK";
    } else if (code >= 300 && code < 400) {
      status = "redirect";
      httpMessage = "Redirection";
    } else if (code >= 400 && code < 500) {
      status = "clientError";
      httpMessage = "Client Error";
    } else if (code >= 500 && code < 600) {
      status = "serverError";
      httpMessage = "Server Error";
    } else {
      status = "unknown";
      httpMessage = "Unknown Status";
    }

    const transformedObj = {
      status: status,
      httpCode: code,
      httpMessage: httpMessage,
      statusDescription: details.description,
      schema: details.schema,
    };

    responses.push(transformedObj);
  }

  return { responses };
}

function getParameters(data, firstKey) {
  if (!data?.paths) {
    return ""; // or a default value, or throw an error, as appropriate
  }

  const pathData = tryPaths(data, firstKey);
  if (!pathData) {
    return null; // or a default value, or throw an error
  }

  const parameters = tryWithProperty(pathData, "parameters");
  if (!parameters) {
    return null;
  }
  return parameters.length > 0 ? parameters[0] : null;
}

function getResponses(data, firstKey) {
  const pathData = tryPaths(data, firstKey);
  if (!pathData) {
    console.error(data.paths);
    return null; // or a default value, or throw an error, as appropriate
  }

  if (!pathData) {
    return null; // or a default value, or throw an error
  }

  const responses = tryWithProperty(pathData, "responses");
  if (!responses) {
    return null;
  }
  return transformObject(getNonEmptyObject(responses)).responses;
}

module.exports = {
  getMethod,
  getParameters,
  getResponses,
};
