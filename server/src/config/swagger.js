import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Smart Quiz Platform API",
      version: "1.0.0",
      description: "OpenAPI documentation for the Smart Quiz Platform backend.",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Backend and integration health checks",
      },
      {
        name: "Authentication",
        description: "Account registration and login",
      },
    ],
    components: {
      schemas: {
        AuthUser: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              format: "uuid",
              example: "7c0cf705-2d7a-4dbf-b3fc-37c3d2f86d31",
            },
            email: {
              type: "string",
              format: "email",
              example: "learner@example.com",
            },
            username: {
              type: "string",
              example: "learner_01",
            },
            fullName: {
              type: "string",
              example: "Nguyen Van A",
            },
            phoneNumber: {
              type: "string",
              nullable: true,
              example: null,
            },
            avatarUrl: {
              type: "string",
              nullable: true,
              example: null,
            },
            bio: {
              type: "string",
              nullable: true,
              example: null,
            },
            accountStatus: {
              type: "string",
              enum: ["active", "pending", "locked", "disabled"],
              example: "active",
            },
            activeRole: {
              type: "string",
              enum: ["learner", "teacher", "admin"],
              example: "learner",
            },
            isPremium: {
              type: "boolean",
              example: false,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["fullName", "username", "email", "password", "confirmPassword"],
          properties: {
            fullName: {
              type: "string",
              example: "Nguyen Van A",
            },
            username: {
              type: "string",
              minLength: 3,
              maxLength: 30,
              pattern: "^[a-zA-Z0-9_]{3,30}$",
              example: "learner_01",
            },
            email: {
              type: "string",
              format: "email",
              example: "learner@example.com",
            },
            password: {
              type: "string",
              minLength: 8,
              format: "password",
              example: "Password123",
            },
            confirmPassword: {
              type: "string",
              minLength: 8,
              format: "password",
              example: "Password123",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "learner@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "Password123",
            },
          },
        },
        SupabaseSession: {
          type: "object",
          nullable: true,
          description: "Supabase auth session returned when the provider creates one.",
          additionalProperties: true,
        },
        AuthSuccessResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Login successful. Welcome back.",
            },
            session: {
              $ref: "#/components/schemas/SupabaseSession",
            },
            user: {
              $ref: "#/components/schemas/AuthUser",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "The information is invalid. Please check and try again.",
            },
            fields: {
              type: "object",
              additionalProperties: {
                type: "string",
              },
              example: {
                email: "Please enter a valid email address.",
              },
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            ok: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Supabase connected",
            },
          },
        },
      },
    },
    paths: {
      "/": {
        get: {
          tags: ["Health"],
          summary: "Root health check",
          responses: {
            200: {
              description: "API root status text",
              content: {
                "text/html": {
                  schema: {
                    type: "string",
                    example: "API running...",
                  },
                },
              },
            },
          },
        },
      },
      "/health/supabase": {
        get: {
          tags: ["Health"],
          summary: "Check Supabase connectivity",
          responses: {
            200: {
              description: "Supabase is reachable",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/HealthResponse",
                  },
                },
              },
            },
            500: {
              description: "Supabase check failed",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new account",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RegisterRequest",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Account created successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AuthSuccessResponse",
                  },
                },
              },
            },
            400: {
              description: "Invalid request payload",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            409: {
              description: "Duplicate email or username",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            500: {
              description: "Registration failed",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Log in with email and password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoginRequest",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AuthSuccessResponse",
                  },
                },
              },
            },
            400: {
              description: "Invalid request payload",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            401: {
              description: "Incorrect email or password",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            403: {
              description: "Account is not active",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            404: {
              description: "Account profile was not found",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            500: {
              description: "Login failed",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export { swaggerUi };
