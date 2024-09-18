const v1 = require("../controllers/v1")
const health = require("../controllers/health")

// Sets up the routes.
module.exports.setup = app => {
  /**
   * @swagger
   * /api/v1/services:
   *    get:
   *      tags:
   *      - Services
   *      summary: Return all services
   *      description: Return all services
   *      parameters:
   *       - $ref: '#/parameters/per_page'
   *       - $ref: '#/parameters/page'
   *       - $ref: '#/parameters/keywords'
   *       - $ref: '#/parameters/location'
   *       - $ref: '#/parameters/lat'
   *       - $ref: '#/parameters/lng'
   *       - $ref: '#/parameters/proximity'
   *       - $ref: '#/parameters/directories'
   *       - $ref: '#/parameters/taxonomies'
   *       - $ref: '#/parameters/needs'
   *       - $ref: '#/parameters/accessibilities'
   *       - $ref: '#/parameters/days'
   *       - $ref: '#/parameters/only'
   *       - $ref: '#/parameters/min_age'
   *       - $ref: '#/parameters/max_age'
   *       - $ref: '#/parameters/start_time'
   *       - $ref: '#/parameters/end_time'
   *       - $ref: '#/parameters/day'
   *       - $ref: '#/parameters/start_date'
   *       - $ref: '#/parameters/end_date'
   *      responses:
   *        '200':
   *          description: successful operation
   *          content:
   *            application/json:
   *              schema:
   *                type: array
   *                items:
   *                  "$ref": "#/components/schemas/Service"
   *        '404':
   *          description: Service not found
   *          content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  error:
   *                    type: string
   *                    description: Service not found
   *                    example: No matching document
   */
  app.get("/api/v1/services", v1.services.index)

  /**
   * @swagger
   * /api/v1/services/{id}:
   *   get:
   *     tags:
   *     - Services
   *     summary: Find service by ID
   *     description: Returns a single service
   *     parameters:
   *     - name: id
   *       in: path
   *       description: ID of service to return
   *       required: true
   *       schema:
   *         type: integer
   *         format: int64
   *     responses:
   *       '200':
   *          description: successful operation
   *          content:
   *            application/json:
   *              schema:
   *                $ref: '#/components/schemas/Service'
   *       '404':
   *         description: Service not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   description: Service not found
   *                   example: No matching document
   *
   */
  app.get("/api/v1/services/:id", v1.services.show)

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Healthcheck endpoint to verify that service is running and able to accept new connections
   *     security: []
   *     tags: [Utilities]
   *     responses:
   *       200:
   *         description: Healthcheck response
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 uptime:
   *                   type: number
   *                   example: 7.720462378
   *                 message:
   *                   type: string
   *                   example: Ok
   *                 date:
   *                   type: string
   *                   format: date-time
   *                   example: "2024-09-13T15:33:14.165Z"
   */
  app.get("/health", health)
}
