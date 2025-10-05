import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SMIS API',
      version: '1.0.0',
      description: 'API documentation for the Student Management Information System',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // files containing annotations as above
};

const specs = swaggerJsdoc(options);

export default (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
