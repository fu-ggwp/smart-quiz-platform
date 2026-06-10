import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const jsonContent = (schema) => ({
  "application/json": {
    schema,
  },
});

const okResponse = (description, schema) => ({
  description,
  content: jsonContent(schema),
});

const errorResponse = (description) => ({
  description,
  content: jsonContent({ $ref: "#/components/schemas/ErrorResponse" }),
});

const authErrorResponses = {
  401: errorResponse("Missing, invalid, or expired access token"),
};

const forbiddenResponse = {
  403: errorResponse("Authenticated user does not have permission for this action"),
};

const idParam = (name, description) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: {
    type: "string",
    format: "uuid",
  },
});

const queryParam = (name, description, schema) => ({
  name,
  in: "query",
  required: false,
  description,
  schema,
});

const bearerSecurity = [{ bearerAuth: [] }];

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
        description: "Account registration, sessions, and profile lookup",
      },
      {
        name: "Exams",
        description: "Teacher exam sessions",
      },
      {
        name: "Study Sets",
        description: "Study set management and learner practice sessions",
      },
      {
        name: "Classes",
        description: "Teacher classes",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Supabase access token sent as `Authorization: Bearer <token>`.",
        },
      },
      schemas: {
        ApiSuccess: {
          type: "object",
          required: ["ok", "data"],
          properties: {
            ok: {
              type: "boolean",
              example: true,
            },
            data: {
              nullable: true,
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            ok: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Request failed",
            },
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
        MessageResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Password reset email sent",
            },
          },
        },
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
        ForgotPasswordRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "learner@example.com",
            },
            redirectTo: {
              type: "string",
              format: "uri",
              example: "http://localhost:3000/reset-password",
            },
          },
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["newPassword"],
          properties: {
            newPassword: {
              type: "string",
              minLength: 8,
              format: "password",
              example: "NewPassword123",
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
        StudySet: {
          type: "object",
          additionalProperties: true,
          properties: {
            study_set_id: {
              type: "string",
              format: "uuid",
            },
            teacher_id: {
              type: "string",
              format: "uuid",
            },
            title: {
              type: "string",
              example: "Biology Chapter 1",
            },
            description: {
              type: "string",
              nullable: true,
            },
            visibility: {
              type: "string",
              enum: ["private", "public"],
              example: "private",
            },
            source_question_bank_id: {
              type: "string",
              format: "uuid",
              nullable: true,
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        StudySetRequest: {
          type: "object",
          required: ["title"],
          properties: {
            title: {
              type: "string",
              example: "Biology Chapter 1",
            },
            description: {
              type: "string",
              nullable: true,
              example: "Cell structure and vocabulary",
            },
            visibility: {
              type: "string",
              enum: ["private", "public"],
              default: "private",
            },
            classId: {
              type: "string",
              format: "uuid",
              nullable: true,
            },
            questionBankId: {
              type: "string",
              format: "uuid",
              nullable: true,
            },
          },
        },
        StudySetUpdateRequest: {
          allOf: [
            {
              $ref: "#/components/schemas/StudySetRequest",
            },
          ],
        },
        PracticeSession: {
          type: "object",
          additionalProperties: true,
          properties: {
            practice_attempt_id: {
              type: "string",
              format: "uuid",
            },
            learner_id: {
              type: "string",
              format: "uuid",
            },
            study_set_id: {
              type: "string",
              format: "uuid",
            },
            mode: {
              type: "string",
              enum: ["quiz", "flashcard"],
            },
            status: {
              type: "string",
              example: "in_progress",
            },
            total_score: {
              type: "number",
              example: 0,
            },
            max_score: {
              type: "number",
              example: 10,
            },
            started_at: {
              type: "string",
              format: "date-time",
            },
            submitted_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },
        StartSessionRequest: {
          type: "object",
          properties: {
            mode: {
              type: "string",
              enum: ["quiz", "flashcard", "flashcards"],
              default: "quiz",
            },
          },
        },
        SubmitAnswerRequest: {
          type: "object",
          required: ["question_id"],
          properties: {
            question_id: {
              type: "string",
              format: "uuid",
            },
            selected_answer_option_ids: {
              type: "array",
              items: {
                type: "string",
                format: "uuid",
              },
              default: [],
            },
            selected_exam_option_indexes: {
              type: "array",
              items: {
                type: "integer",
              },
              default: [],
            },
            is_correct: {
              type: "boolean",
              nullable: true,
            },
            score_awarded: {
              type: "number",
              default: 0,
            },
            review_status: {
              type: "string",
              default: "unreviewed",
            },
          },
        },
        AttemptAnswer: {
          type: "object",
          additionalProperties: true,
          properties: {
            attempt_answer_id: {
              type: "string",
              format: "uuid",
            },
            practice_attempt_id: {
              type: "string",
              format: "uuid",
            },
            question_id: {
              type: "string",
              format: "uuid",
            },
            is_correct: {
              type: "boolean",
              nullable: true,
            },
            score_awarded: {
              type: "number",
            },
          },
        },
        CompleteSessionRequest: {
          type: "object",
          properties: {
            score: {
              type: "number",
              default: 0,
            },
          },
        },
        PracticeSessionResults: {
          type: "object",
          properties: {
            session: {
              $ref: "#/components/schemas/PracticeSession",
            },
            answers: {
              type: "array",
              items: {
                $ref: "#/components/schemas/AttemptAnswer",
              },
            },
          },
        },
        Class: {
          type: "object",
          additionalProperties: true,
          properties: {
            class_id: {
              type: "string",
              format: "uuid",
            },
            teacher_id: {
              type: "string",
              format: "uuid",
            },
            class_name: {
              type: "string",
              example: "SE1701",
            },
            subject: {
              type: "string",
              nullable: true,
              example: "Software Engineering",
            },
            status: {
              type: "string",
              example: "active",
            },
            member_count: {
              type: "integer",
              example: 28,
            },
          },
        },
        ExamSession: {
          type: "object",
          additionalProperties: true,
          properties: {
            exam_session_id: {
              type: "string",
              format: "uuid",
            },
            class_id: {
              type: "string",
              format: "uuid",
            },
            teacher_id: {
              type: "string",
              format: "uuid",
            },
            question_bank_id: {
              type: "string",
              format: "uuid",
            },
            title: {
              type: "string",
              example: "Midterm Exam",
            },
            description: {
              type: "string",
              nullable: true,
            },
            status: {
              type: "string",
              example: "draft",
            },
            start_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            end_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            duration_minutes: {
              type: "integer",
              example: 45,
            },
            attempt_limit: {
              type: "integer",
              example: 1,
            },
            question_count: {
              type: "integer",
              example: 30,
            },
            result_visibility: {
              type: "string",
              example: "after_submit",
            },
          },
        },
        ExamSessionsResponseData: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                $ref: "#/components/schemas/ExamSession",
              },
            },
            total: {
              type: "integer",
              example: 24,
            },
            page: {
              type: "integer",
              example: 1,
            },
            pageSize: {
              type: "integer",
              example: 10,
            },
            totalPages: {
              type: "integer",
              example: 3,
            },
            classes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  class_id: {
                    type: "string",
                    format: "uuid",
                  },
                  class_name: {
                    type: "string",
                    example: "SE1701",
                  },
                },
              },
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
            200: okResponse("Supabase is reachable", {
              $ref: "#/components/schemas/HealthResponse",
            }),
            500: errorResponse("Supabase check failed"),
          },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new account",
          requestBody: {
            required: true,
            content: jsonContent({ $ref: "#/components/schemas/RegisterRequest" }),
          },
          responses: {
            201: okResponse("Account created successfully", {
              $ref: "#/components/schemas/AuthSuccessResponse",
            }),
            400: errorResponse("Invalid request payload"),
            409: errorResponse("Duplicate email or username"),
            500: errorResponse("Registration failed"),
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Log in with email and password",
          requestBody: {
            required: true,
            content: jsonContent({ $ref: "#/components/schemas/LoginRequest" }),
          },
          responses: {
            200: okResponse("Login successful", {
              $ref: "#/components/schemas/AuthSuccessResponse",
            }),
            400: errorResponse("Invalid request payload"),
            401: errorResponse("Incorrect email or password"),
            403: errorResponse("Account is not active"),
            404: errorResponse("Account profile was not found"),
            500: errorResponse("Login failed"),
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Authentication"],
          summary: "Log out the current session",
          security: bearerSecurity,
          responses: {
            200: okResponse("Logged out", { $ref: "#/components/schemas/MessageResponse" }),
            500: errorResponse("Logout failed"),
          },
        },
      },
      "/api/auth/forgot-password": {
        post: {
          tags: ["Authentication"],
          summary: "Request a password reset email",
          requestBody: {
            required: true,
            content: jsonContent({ $ref: "#/components/schemas/ForgotPasswordRequest" }),
          },
          responses: {
            200: okResponse("Password reset email sent", {
              $ref: "#/components/schemas/MessageResponse",
            }),
            400: errorResponse("Invalid request payload"),
            500: errorResponse("Password reset request failed"),
          },
        },
      },
      "/api/auth/reset-password": {
        post: {
          tags: ["Authentication"],
          summary: "Reset the password for the bearer session",
          security: bearerSecurity,
          requestBody: {
            required: true,
            content: jsonContent({ $ref: "#/components/schemas/ResetPasswordRequest" }),
          },
          responses: {
            200: okResponse("Password updated", { $ref: "#/components/schemas/MessageResponse" }),
            400: errorResponse("Invalid request payload"),
            401: errorResponse("Missing, invalid, or expired reset token"),
            500: errorResponse("Password reset failed"),
          },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Authentication"],
          summary: "Get the current authenticated profile",
          security: bearerSecurity,
          responses: {
            200: okResponse("Current profile", { $ref: "#/components/schemas/AuthUser" }),
            ...authErrorResponses,
            404: errorResponse("Profile not found"),
            500: errorResponse("Profile lookup failed"),
          },
        },
      },
      "/api/exams": {
        get: {
          tags: ["Exams"],
          summary: "List the current teacher's exam sessions",
          security: bearerSecurity,
          parameters: [
            queryParam("page", "Page number, starting at 1", {
              type: "integer",
              minimum: 1,
              default: 1,
            }),
            queryParam("pageSize", "Number of records per page, capped at 50", {
              type: "integer",
              minimum: 1,
              maximum: 50,
              default: 10,
            }),
            queryParam("search", "Search by title, description, status, or class name", {
              type: "string",
            }),
            queryParam("status", "Filter by exam status", {
              type: "string",
            }),
            queryParam("classId", "Filter by class id", {
              type: "string",
              format: "uuid",
            }),
            queryParam("resultVisibility", "Filter by result visibility", {
              type: "string",
            }),
            queryParam("sortBy", "Sort option", {
              type: "string",
              enum: ["latest", "start_asc", "start_desc", "title_asc"],
              default: "latest",
            }),
          ],
          responses: {
            200: okResponse("Teacher exam sessions", {
              allOf: [
                { $ref: "#/components/schemas/ApiSuccess" },
                {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/ExamSessionsResponseData" },
                  },
                },
              ],
            }),
            ...authErrorResponses,
            500: errorResponse("Exam session lookup failed"),
          },
        },
      },
      "/api/study-sets": {
        get: {
          tags: ["Study Sets"],
          summary: "List public study sets or study sets assigned to a class",
          security: bearerSecurity,
          parameters: [
            queryParam("classId", "Class id used to include assigned study sets", {
              type: "string",
              format: "uuid",
            }),
          ],
          responses: {
            200: okResponse("Available study sets", {
              allOf: [
                { $ref: "#/components/schemas/ApiSuccess" },
                {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/StudySet" },
                    },
                  },
                },
              ],
            }),
            ...authErrorResponses,
            500: errorResponse("Study set lookup failed"),
          },
        },
        post: {
          tags: ["Study Sets"],
          summary: "Create a study set",
          security: bearerSecurity,
          requestBody: {
            required: true,
            content: jsonContent({ $ref: "#/components/schemas/StudySetRequest" }),
          },
          responses: {
            201: okResponse("Study set created", {
              allOf: [
                { $ref: "#/components/schemas/ApiSuccess" },
                {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/StudySet" },
                  },
                },
              ],
            }),
            ...authErrorResponses,
            400: errorResponse("Study set creation failed"),
            422: errorResponse("Title is required"),
          },
        },
      },
      "/api/study-sets/mine": {
        get: {
          tags: ["Study Sets"],
          summary: "List study sets owned by the current teacher",
          security: bearerSecurity,
          responses: {
            200: okResponse("Owned study sets", {
              allOf: [
                { $ref: "#/components/schemas/ApiSuccess" },
                {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/StudySet" },
                    },
                  },
                },
              ],
            }),
            ...authErrorResponses,
            500: errorResponse("Study set lookup failed"),
          },
        },
      },
      "/api/study-sets/{id}": {
        get: {
          tags: ["Study Sets"],
          summary: "Get one study set by id",
          security: bearerSecurity,
          parameters: [idParam("id", "Study set id")],
          responses: {
            200: okResponse("Study set details", {
              allOf: [
                { $ref: "#/components/schemas/ApiSuccess" },
                {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/StudySet" },
                  },
                },
              ],
            }),
            ...authErrorResponses,
            404: errorResponse("Study set not found"),
          },
        },
        patch: {
          tags: ["Study Sets"],
          summary: "Update a study set",
          security: bearerSecurity,
          parameters: [idParam("id", "Study set id")],
          requestBody: {
            required: true,
            content: jsonContent({ $ref: "#/components/schemas/StudySetUpdateRequest" }),
          },
          responses: {
            200: okResponse("Study set updated", {
              allOf: [
                { $ref: "#/components/schemas/ApiSuccess" },
                {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/StudySet" },
                  },
                },
              ],
            }),
            ...authErrorResponses,
            ...forbiddenResponse,
            400: errorResponse("Study set update failed"),
            404: errorResponse("Study set not found"),
          },
        },
        delete: {
          tags: ["Study Sets"],
          summary: "Delete a study set",
          security: bearerSecurity,
          parameters: [idParam("id", "Study set id")],
          responses: {
            200: okResponse("Study set deleted", {
              allOf: [
                { $ref: "#/components/schemas/ApiSuccess" },
                {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        message: {
                          type: "string",
                          example: "Deleted",
                        },
                      },
                    },
                  },
                },
              ],
            }),
            ...authErrorResponses,
            ...forbiddenResponse,
            400: errorResponse("Study set deletion failed"),
            404: errorResponse("Study set not found"),
          },
        },
      },
      "/api/study-sets/{id}/sessions": {
        post: {
          tags: ["Study Sets"],
          summary: "Start a learner practice session for a study set",
          security: bearerSecurity,
          parameters: [idParam("id", "Study set id")],
          requestBody: {
            required: false,
            content: jsonContent({ $ref: "#/components/schemas/StartSessionRequest" }),
          },
          responses: {
            201: okResponse("Practice session started", {
              allOf: [
                { $ref: "#/components/schemas/ApiSuccess" },
                {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/PracticeSession" },
                  },
                },
              ],
            }),
            ...authErrorResponses,
            ...forbiddenResponse,
            400: errorResponse("Practice session could not be started"),
            404: errorResponse("Study set not found"),
          },
        },
      },
      "/api/study-sets/sessions/mine": {
        get: {
          tags: ["Study Sets"],
          summary: "List the current learner's practice sessions",
          security: bearerSecurity,
          responses: {
            200: okResponse("Learner practice sessions", {
              allOf: [
                { $ref: "#/components/schemas/ApiSuccess" },
                {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/PracticeSession" },
                    },
                  },
                },
              ],
            }),
            ...authErrorResponses,
            ...forbiddenResponse,
            500: errorResponse("Practice session lookup failed"),
          },
        },
      },
      "/api/study-sets/sessions/{sessionId}/answers": {
        post: {
          tags: ["Study Sets"],
          summary: "Submit an answer for a learner practice session",
          security: bearerSecurity,
          parameters: [idParam("sessionId", "Practice session id")],
          requestBody: {
            required: true,
            content: jsonContent({ $ref: "#/components/schemas/SubmitAnswerRequest" }),
          },
          responses: {
            201: okResponse("Answer recorded", {
              allOf: [
                { $ref: "#/components/schemas/ApiSuccess" },
                {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/AttemptAnswer" },
                  },
                },
              ],
            }),
            ...authErrorResponses,
            ...forbiddenResponse,
            400: errorResponse("Answer submission failed"),
          },
        },
      },
      "/api/study-sets/sessions/{sessionId}/complete": {
        patch: {
          tags: ["Study Sets"],
          summary: "Complete a learner practice session",
          security: bearerSecurity,
          parameters: [idParam("sessionId", "Practice session id")],
          requestBody: {
            required: false,
            content: jsonContent({ $ref: "#/components/schemas/CompleteSessionRequest" }),
          },
          responses: {
            200: okResponse("Practice session completed", {
              allOf: [
                { $ref: "#/components/schemas/ApiSuccess" },
                {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/PracticeSession" },
                  },
                },
              ],
            }),
            ...authErrorResponses,
            ...forbiddenResponse,
            400: errorResponse("Practice session completion failed"),
          },
        },
      },
      "/api/study-sets/sessions/{sessionId}/results": {
        get: {
          tags: ["Study Sets"],
          summary: "Get practice session results",
          security: bearerSecurity,
          parameters: [idParam("sessionId", "Practice session id")],
          responses: {
            200: okResponse("Practice session results", {
              allOf: [
                { $ref: "#/components/schemas/ApiSuccess" },
                {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/PracticeSessionResults" },
                  },
                },
              ],
            }),
            ...authErrorResponses,
            ...forbiddenResponse,
            404: errorResponse("Practice session not found"),
          },
        },
      },
      "/api/classes": {
        get: {
          tags: ["Classes"],
          summary: "List classes owned by the current teacher",
          security: bearerSecurity,
          responses: {
            200: okResponse("Teacher classes", {
              allOf: [
                { $ref: "#/components/schemas/ApiSuccess" },
                {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Class" },
                    },
                  },
                },
              ],
            }),
            ...authErrorResponses,
            500: errorResponse("Class lookup failed"),
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export { swaggerUi };
