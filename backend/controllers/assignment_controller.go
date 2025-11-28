package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/Aashishvatwani/homeworld/config"
	"github.com/Aashishvatwani/homeworld/models"
	"github.com/gin-gonic/gin"
)

func CreateAssignment(c *gin.Context) {
	var assignment models.Assignment
	if err := c.BindJSON(&assignment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	assignment.CreatedAt = time.Now()
	assignment.Status = "Pending"

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	assignmentCollection := config.DB.Collection("assignments")
	_, err := assignmentCollection.InsertOne(ctx, assignment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create assignment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Assignment created"})
}
