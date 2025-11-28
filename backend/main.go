package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/Aashishvatwani/homeworld/config"
	"github.com/Aashishvatwani/homeworld/routes"
	"github.com/gin-contrib/cors"
)

func main() {
	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file: ", err)
	}

	// Connect to MongoDB
	config.ConnectDB()

	// Setup Gin router
	r := gin.Default()

	// Configure CORS to allow all origins
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port
	}

	// Register all routes
	routes.UserRoutes(r)
	routes.AssignmentRoutes(r)
	routes.PaymentRoutes(r)
	routes.ChatRoutes(r)
	routes.NotificationRoutes(r)
	routes.ContractTestRoutes(r) // Smart contract test endpoints

	log.Println("✅ Server running on port:", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Error running server: ", err)
	}
}
