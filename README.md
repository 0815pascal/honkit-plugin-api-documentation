# Honkit API Documentation Plugin

The *Honkit API Documentation Plugin* enables the automatic creation of beautifully designed API documentation. Its design was heavily inspired by [GitBook's old OpenAPI-block](https://web.archive.org/web/20230923080123/https://docs.gitbook.com/content-creation/blocks/api-method). 

This plugin is still in its infancy, so expect lots of bugs. However, the basics are covered, and more is to come.

## Installation

```
npm i --save honkit-plugin-api-documentation
```

### Configuration
In your `book.json` or other whatever you have called your configuration-file: 

```json
{
    "root": ".",
    "plugins": ["honkit-plugin-api-documentation"]
}
```

## Getting Started

### Dereferencing Swagger-File
In the first step, we need to dereference our `Swagger` file as we want to work with "Vanilla" JSON. You can achieve this using any of the freely available tools, such as the [Swagger & OpenAPI Online Validator](https://apitools.dev/swagger-parser/online). 

Dereferencing basically means that we want to remove the `$ref` from this shape.

```json
      "responses": {
          "200": {
            "description": "pet response",
            "schema": {
              "type": "array",
              "items": {
                "$ref": "#/definitions/Pet"
              }
            }
          }
```

Dereferenced: 
```json
 "responses": {
          "200": {
            "description": "pet response",
            "schema": {
              "type": "array",
              "items": {
                "type": "object",
                "allOf": [
                  {
                    "type": "object",
                    "required": [
                      "name"
                    ],
                    "properties": {
                      "name": {
                        "type": "string"
                      },
                      "tag": {
                        "type": "string"
                      }
                    }
                  },
                  {
                    "required": [
                      "id"
                    ],
                    "properties": {
                      "id": {
                        "type": "integer",
                        "format": "int64"
                      }
                    }
                  }
                ]
              }
            }
          },
```

### Creating your .md File
The next step is simple. Just create a new `.md` file and add the dereferenced JSON between two tags:

```
<!-- API_START --> 
   {...JSON...}
<!-- API_END -->
```

Now `build` and `serve` it! 

## Limitations
- The plugin currently only supports the `OpenAPI 2.0` (or `Swagger 2.0`) [Specification](https://swagger.io/specification/v2/)
- Not all Swagger objects are supported or can be displayed.
- *Dereferencing* has to be done manually.
