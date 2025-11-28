package controllers

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/Aashishvatwani/homeworld/config"
	"github.com/Aashishvatwani/homeworld/models"
)

type SolverRank struct {
	Solver models.User `json:"solver"`
	Score  float64     `json:"score"`
}

// POST /api/assignment/create
func CreateAssignmentRoute(c *gin.Context) {
	var assignment models.Assignment
	if err := c.ShouldBindJSON(&assignment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignment.Status = "posted"
	assignment.CreatedAt = time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	assignmentCollection := config.DB.Collection("assignments")
	result, err := assignmentCollection.InsertOne(ctx, assignment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to post assignment"})
		return
	}

	// Find top solvers
	topSolvers := findTopSolvers(ctx, assignment)
	c.JSON(http.StatusOK, gin.H{
		"message":     "Assignment created successfully",
		"id":          result.InsertedID,
		"top_solvers": topSolvers,
	})
}

func findTopSolvers(ctx context.Context, assignment models.Assignment) []SolverRank {
	solverCollection := config.DB.Collection("users")
	cursor, _ := solverCollection.Find(ctx, bson.M{"role": "solver"})

	var solvers []models.User
	cursor.All(ctx, &solvers)

	var scored []SolverRank

	for _, solver := range solvers {
		// Simple scoring algorithm
		score := float64(0)

		// Skill match score (40%)
		for _, skill := range solver.Skills {
			if stringInSlice(skill, assignment.Skills) {
				score += 40.0 / float64(len(assignment.Skills))
			}
		}

		// Price score (20%)
		if solver.PricePerJob > 0 {
			score += 20.0 / (solver.PricePerJob / 1000)
		}

		// Speed score (20%)
		if solver.Speed > 0 {
			score += 20.0 / (solver.Speed / 48)
		}

		// Distance score (20%)
		distance := haversineDistance(
			assignment.Lat, assignment.Lng,
			solver.Location.Latitude, solver.Location.Longitude,
		)
		if distance > 0 {
			score += 20.0 / (distance / 100)
		}

		scored = append(scored, SolverRank{Solver: solver, Score: score})
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].Score > scored[j].Score
	})

	if len(scored) > 10 {
		scored = scored[:10]
	} else {
		return scored
	}
	return scored
}

func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371 // Earth radius in km

	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func stringInSlice(a string, list []string) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}

// GET /api/assignments
func GetAssignments(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	assignmentCollection := config.DB.Collection("assignments")
	cursor, err := assignmentCollection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assignments"})
		return
	}

	var assignments []models.Assignment
	cursor.All(ctx, &assignments)

	c.JSON(http.StatusOK, assignments)
}

// GET /api/assignments/:id
func GetAssignment(c *gin.Context) {
	assignmentID := c.Param("id")
	fmt.Printf("assignmentID %s\n", assignmentID)

	// Convert string ID to ObjectID
	objID, err := primitive.ObjectIDFromHex(assignmentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assignment ID format"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	assignmentCollection := config.DB.Collection("assignments")
	var assignment models.Assignment
	err = assignmentCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&assignment)
	if err != nil {
		fmt.Printf("FindOne error: %v\n", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Assignment not found"})
		return
	}

	c.JSON(http.StatusOK, assignment)
}
