package routes

import (
	"github.com/Aashishvatwani/homeworld/controllers"
	"github.com/gin-gonic/gin"
)

func AssignmentRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// Assignment CRUD
		api.POST("/assignments/create", controllers.CreateAssignmentRoute)
		api.POST("/assignment/create", controllers.CreateAssignmentRoute)
		api.GET("/assignments", controllers.GetAssignments)
		api.GET("/assignments/:id", controllers.GetAssignment)

		// AI-Powered Assignment Creation (from text message)
		api.POST("/assignments/create-from-text", controllers.CreateAssignmentFromText)

		// NLP parsing only (no database save)
		api.POST("/nlp/parse", controllers.ParseAssignmentNLP)

		// Matching
		api.POST("/match/solvers", controllers.MatchSolvers)
		api.POST("/assignments/complete", controllers.AssignmentCompleted)
	}
}
