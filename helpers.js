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

function getMethod(data, path) {
  if (typeof data !== "object" || data === null) {
    throw new Error("data is not an object");
  }

  if (typeof path !== "string") {
    throw new Error("Path must be a string");
  }

  if (!data?.paths) {
    return data;
  }

  const pathData = data.paths[path];
  if (!pathData) {
    return null;
  }

  const key = Object.keys(pathData).find((key) => pathData[key]);
  if (!key) {
    return null;
  }
  return key;
}

function getParameters(data, path) {
  if (!data?.paths) {
    return data; // or a default value, or throw an error, as appropriate
  }

  const pathData = data.paths[path];
  if (!pathData) {
    return null; // or a default value, or throw an error
  }

  const parameters = pathData?.get?.parameters;
  console.log(parameters);
  if (!parameters) {
    return null;
  }
  return parameters.length > 0 ? parameters[0] : null;
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

function getResponses(data, path) {
  if (!data?.paths) {
    return data; // or a default value, or throw an error, as appropriate
  }

  const pathData = data.paths[path];
  if (!pathData) {
    return null; // or a default value, or throw an error
  }

  const responses = pathData?.get?.responses;
  console.log(responses);
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
