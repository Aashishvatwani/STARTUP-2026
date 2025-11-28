package controllers

import (
	"context"
	"net/http"
	"time"

	"fmt"

	"github.com/Aashishvatwani/homeworld/config"
	"github.com/Aashishvatwani/homeworld/models"
	"github.com/Aashishvatwani/homeworld/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// POST /api/auth/register
func RegisterUser(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}
	user.Password = hashedPassword
	user.CreatedAt = time.Now().Unix()
	user.Reliability = 1.0 // Start with perfect score

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userCollection := config.DB.Collection("users")
	result, err := userCollection.InsertOne(ctx, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	// Generate JWT
	token, _ := utils.GenerateJWT(user.Email, user.Role)

	c.JSON(http.StatusOK, gin.H{
		"message": "User registered successfully",
		"id":      result.InsertedID,
		"token":   token,
	})
}

// POST /api/auth/login
func LoginUser(c *gin.Context) {
	var loginReq struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := c.ShouldBindJSON(&loginReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userCollection := config.DB.Collection("users")
	var user models.User
	err := userCollection.FindOne(ctx, bson.M{"email": loginReq.Email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password
	if !utils.CheckPassword(user.Password, loginReq.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	if user.Role != loginReq.Role {
		// Update role in DB to match requested login role
		_, err := userCollection.UpdateOne(ctx, bson.M{"_id": user.ID}, bson.M{"$set": bson.M{"role": loginReq.Role}})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
			return
		}
		user.Role = loginReq.Role
		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Role updated to %s", loginReq.Role), "id": user.ID})
		return
	}
	// Generate JWT
	token, _ := utils.GenerateJWT(user.Email, user.Role)

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"id":      user.ID,
		"token":   token,
	})
}

// GET /api/users/:id
func GetUser(c *gin.Context) {
	userID := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(userID)
	fmt.Printf("user: %+v\n", userID)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userCollection := config.DB.Collection("users")
	var user models.User
	err := userCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&user)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// GET /api/users
func GetAllUsers(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userCollection := config.DB.Collection("users")
	cursor, err := userCollection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	var users []models.User
	cursor.All(ctx, &users)

	c.JSON(http.StatusOK, users)
}

// PUT /api/users/:id
func UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(userID)

	var updateData bson.M
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userCollection := config.DB.Collection("users")
	result, err := userCollection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": updateData})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated", "modified_count": result.ModifiedCount})
}
