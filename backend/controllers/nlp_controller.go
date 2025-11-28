package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/Aashishvatwani/homeworld/config"
	"github.com/Aashishvatwani/homeworld/models"
	"github.com/Aashishvatwani/homeworld/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// POST /api/nlp/parse - Parse assignment description text from frontend
// Frontend sends: { "text": "I need a 4 page Python ML assignment due tomorrow" }
// Backend returns: All extracted details (skills, urgency, pages, price, etc.)
func ParseAssignmentNLP(c *gin.Context) {
	var req struct {
		Text   string `json:"text" binding:"required"`
		UserID string `json:"user_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Text message is required"})
		return
	}

	// Call NLP service to extract all assignment details
	nlpResult, err := utils.CallNLPService(req.Text, req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to parse assignment with NLP service",
			"details": err.Error(),
		})
		return
	}

	// Return parsed assignment details to frontend
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Assignment details extracted successfully",
		"data": gin.H{
			"type":            nlpResult.Type,           // Report, Code, Project, etc.
			"topic":           nlpResult.Topic,          // Assignment topic
			"domain":          nlpResult.Domain,         // AI/ML, Electronics, Writing, etc.
			"pages":           nlpResult.Pages,          // Number of pages
			"deadline":        nlpResult.Deadline,       // ISO format deadline
			"urgency":         nlpResult.Urgency,        // High, Medium, Low
			"skills_required": nlpResult.SkillsRequired, // ["Python", "Machine Learning"]
			"estimated_price": nlpResult.EstimatedPrice, // Auto-calculated price
			"original_text":   nlpResult.RawText,        // Original input
			"message":         nlpResult.Message,        // Any additional message
		},
	})
}

// POST /api/assignments/create-from-text - Create assignment from text message (AI-powered)
// Frontend sends: { "text": "I need a 4 page Python ML report due tomorrow", "user_id": "..." }
// Backend: Parses with NLP, creates assignment, finds top solvers, returns everything
func CreateAssignmentFromText(c *gin.Context) {
	var req struct {
		Text      string  `json:"text" binding:"required"`
		UserID    string  `json:"user_id" binding:"required"`
		Title     string  `json:"title"`     // Optional: user can provide title
		Price     float64 `json:"price"`     // Optional: override estimated price
		Latitude  float64 `json:"latitude"`  // Optional: user location
		Longitude float64 `json:"longitude"` // Optional: user location
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Text and user_id are required"})
		return
	}

	// Parse user ID
	userObjID, err := primitive.ObjectIDFromHex(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	// Call NLP service to extract assignment details
	nlpResult, err := utils.CallNLPService(req.Text, req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to parse assignment with NLP",
			"details": err.Error(),
		})
		return
	}

	// Build assignment from NLP results
	assignment := models.Assignment{
		ID:          primitive.NewObjectID(),
		UserID:      userObjID,
		Title:       req.Title,
		Description: req.Text,
		Skills:      nlpResult.SkillsRequired,
		Urgency:     nlpResult.Urgency,
		Pages:       nlpResult.Pages,
		Status:      "posted",
		CreatedAt:   time.Now(),
	}

	// Set title if not provided
	if assignment.Title == "" {
		assignment.Title = nlpResult.Topic
		if assignment.Title == "" {
			assignment.Title = nlpResult.Type + " Assignment"
		}
	}

	// Parse deadline - try multiple formats
	if nlpResult.Deadline != "" {
		// Try RFC3339 format first
		deadlineTime, err := time.Parse(time.RFC3339, nlpResult.Deadline)
		if err != nil {
			// Try other common formats
			formats := []string{
				"2006-01-02T15:04:05Z07:00",
				"2006-01-02 15:04:05",
				"2006-01-02",
			}
			for _, format := range formats {
				deadlineTime, err = time.Parse(format, nlpResult.Deadline)
				if err == nil {
					break
				}
			}
		}
		if err == nil {
			assignment.Deadline = deadlineTime
		} else {
			// Default to 3 days from now if parsing fails
			assignment.Deadline = time.Now().AddDate(0, 0, 3)
		}
	} else {
		// If no deadline provided, default to 3 days from now
		assignment.Deadline = time.Now().AddDate(0, 0, 3)
	}

	// Set price (use provided price or NLP estimated price)
	if req.Price > 0 {
		assignment.Price = req.Price
	} else {
		assignment.Price = nlpResult.EstimatedPrice
	}

	// Initialize BidAmount to 0 (no bids yet)
	assignment.BidAmount = 0

	// Set location
	assignment.Location = models.LocationCoords{
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
	}
	assignment.Lat = req.Latitude
	assignment.Lng = req.Longitude

	// Save to database
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	assignmentCollection := config.DB.Collection("assignments")
	result, err := assignmentCollection.InsertOne(ctx, assignment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create assignment"})
		return
	}

	// Find top matching solvers
	topSolvers := findTopSolversForAssignment(ctx, assignment)

	// Send notifications
	// 1. Notify buyer that top solvers were found
	go NotifyBuyerAboutSolvers(userObjID, assignment.ID, len(topSolvers))

	// 2. Notify top solvers about new assignment (extract solver IDs)
	solverIDs := extractSolverIDs(topSolvers)
	isUrgent := assignment.Urgency == "High"
	go NotifyTopSolversAboutAssignment(assignment.ID, solverIDs, assignment.Title, isUrgent)

	// Return success with all details
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Assignment created successfully from text",
		"assignment": gin.H{
			"id":          result.InsertedID,
			"title":       assignment.Title,
			"description": assignment.Description,
			"type":        nlpResult.Type,
			"domain":      nlpResult.Domain,
			"skills":      assignment.Skills,
			"urgency":     assignment.Urgency,
			"pages":       assignment.Pages,
			"deadline":    assignment.Deadline,
			"price":       assignment.Price,
			"status":      assignment.Status,
		},
		"top_solvers": topSolvers,
		"nlp_analysis": gin.H{
			"skills_detected":  nlpResult.SkillsRequired,
			"estimated_price":  nlpResult.EstimatedPrice,
			"urgency_detected": nlpResult.Urgency,
		},
		"notifications_sent": len(solverIDs) + 1, // solvers + buyer
	})
}

// Helper to extract solver IDs from top solvers list
func extractSolverIDs(topSolvers []interface{}) []primitive.ObjectID {
	var ids []primitive.ObjectID
	// This would extract IDs from the actual solver data structure
	// Placeholder for now
	return ids
}

// Helper function to find top solvers for an assignment
func findTopSolversForAssignment(ctx context.Context, assignment models.Assignment) []interface{} {
	// This reuses the logic from assignment_routes_controller.go
	// Return top 10 solvers based on skills, price, location, speed
	return []interface{}{} // Placeholder - will be implemented with actual matching logic
}
