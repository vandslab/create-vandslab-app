import swaggerAutogen from 'swagger-autogen';
import { allSchemas } from './swagger-schemas';

const doc = {
  info: {
    version: '1.0.0',
    title: 'Swaggertest API',
    description: 'Auto-generated API documentation with swagger-autogen',
  },
  servers: [
    {
      url: 'http://localhost:4000/api',
      description: 'Local development server',
    },
    {
      url: 'http://production.com/api',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and registration endpoints',
    },
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token',
      },
    },
    schemas: allSchemas,
  },
};

const outputFile = './src/docs/swagger-output.json';
const routes = ['./src/api/routes/router.ts'];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc);
