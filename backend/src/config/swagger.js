const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LegacyVault API",
      version: "1.0.0",
      description: "API Documentation for LegacyVault Digital Heritage Management",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Look for swagger documentation in these files:
  apis: ["./src/routes/*.js", "./src/controllers/*.js"], 
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, { explorer: true })
  );
  console.log(`  🌐 Swagger API Docs: http://localhost:5000/api-docs`);
};

module.exports = setupSwagger;
