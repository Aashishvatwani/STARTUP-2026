package controllers

import (
	"context"
	"encoding/json"
	"math"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/Aashishvatwani/homeworld/config"
	"github.com/Aashishvatwani/homeworld/models"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SolverScore struct {
	User  models.User
	Score float64
}

// calculateDistance uses the Haversine formula for location distance (in km)
func calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371 // Earth radius in km
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func MatchSolvers(c *gin.Context) {
	// Read the incoming JSON into a generic map first so we can accept either
	// a full assignment object or a simple { "assignmentId": "..." } payload.
	var body map[string]interface{}
	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var assignment models.Assignment

	// If caller provided an assignmentId, fetch that assignment from DB.
	if v, ok := body["assignmentId"]; ok {
		if idStr, ok := v.(string); ok && idStr != "" {
			oid, err := primitive.ObjectIDFromHex(idStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignmentId"})
				return
			}

			assignColl := config.DB.Collection("assignments")
			ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel2()
			if err := assignColl.FindOne(ctx2, bson.M{"_id": oid}).Decode(&assignment); err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "assignment not found"})
				return
			}
		}
	} else {
		// Otherwise attempt to unmarshal the provided body into an Assignment struct
		b, _ := json.Marshal(body)
		if err := json.Unmarshal(b, &assignment); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment payload"})
			return
		}
	}

	userCollection := config.DB.Collection("users")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := userCollection.Find(ctx, bson.M{"role": "solver"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch solvers"})
		return
	}
	defer cursor.Close(ctx)

	var solvers []models.User
	if err = cursor.All(ctx, &solvers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding solvers"})
		return
	}

	var scored []SolverScore

	for _, solver := range solvers {
		score := 0.0

		// 1️⃣ Skill Match
		for _, skill := range solver.Skills {
			if strings.Contains(strings.ToLower(assignment.Description), strings.ToLower(skill)) {
				score += 5 // each matching skill gives 5 points
			}
		}

		// 2️⃣ Time Efficiency
		if solver.AvgSpeed > 0 {
			score += 100.0 / float64(solver.AvgSpeed) // faster solvers get more points
		}

		// 3️⃣ Location Proximity (within 100 km bonus)
		if assignment.Location.Latitude != 0 && solver.Location.Latitude != 0 {
			distance := calculateDistance(assignment.Location.Latitude, assignment.Location.Longitude,
				solver.Location.Latitude, solver.Location.Longitude)
			if distance < 100 {
				score += 10
			} else if distance < 300 {
				score += 5
			}
		}

		scored = append(scored, SolverScore{User: solver, Score: score})
	}

	// 4️⃣ Sort by score
	sort.Slice(scored, func(i, j int) bool {
		return scored[i].Score > scored[j].Score
	})

	// 5️⃣ Pick top 10
	if len(scored) > 10 {
		scored = scored[:10]
	}

	c.JSON(http.StatusOK, scored)
}
