package controllers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/Aashishvatwani/homeworld/config"
	"github.com/Aashishvatwani/homeworld/models"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// POST /api/chat/create
func CreateChat(c *gin.Context) {
	var chat models.Chat
	if err := c.ShouldBindJSON(&chat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Initialize empty messages array (CRITICAL: prevents null error)
	if chat.Messages == nil {
		chat.Messages = []models.Message{}
	}

	chat.CreatedAt = time.Now()
	chat.UpdatedAt = time.Now()
	chat.Status = "active"

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	chatCollection := config.DB.Collection("chats")
	result, err := chatCollection.InsertOne(ctx, chat)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create chat"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Chat created successfully",
		"id":      result.InsertedID,
		"chat":    chat,
	})
}

// POST /api/chat/:id/message
func SendMessage(c *gin.Context) {
	chatID := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(chatID)
	fmt.Printf("[SendMessage] Received request for chatID: %s\n", chatID)

	var message models.Message
	if err := c.ShouldBindJSON(&message); err != nil {
		fmt.Printf("[SendMessage] Error binding JSON: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message.ID = primitive.NewObjectID()
	message.Timestamp = time.Now()
	fmt.Printf("[SendMessage] Message prepared - ID: %s, SenderRole: %s, Content: %s\n",
		message.ID.Hex(), message.SenderRole, message.Content)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	chatCollection := config.DB.Collection("chats")
	fmt.Printf("[SendMessage] Updating chat document with new message\n")

	// Push the entire message object, not just content
	result, err := chatCollection.UpdateOne(
		ctx,
		bson.M{"_id": objID},
		bson.M{
			"$push": bson.M{"messages": message},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)
	if err != nil {
		fmt.Printf("[SendMessage] Error updating chat: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	// Check if chat exists
	if result.MatchedCount == 0 {
		fmt.Printf("[SendMessage] Error: Chat with ID %s not found\n", chatID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found. Please create a chat first."})
		return
	}
	fmt.Printf("[SendMessage] Message saved to database successfully (matched: %d, modified: %d)\n",
		result.MatchedCount, result.ModifiedCount)

	// Get chat details to notify the recipient
	var chat models.Chat
	err = chatCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&chat)
	if err != nil {
		fmt.Printf("[SendMessage] Error retrieving chat details: %v\n", err)
	} else {
		fmt.Printf("[SendMessage] Chat details retrieved - BuyerID: %s, SolverID: %s\n",
			chat.BuyerID.Hex(), chat.SolverID.Hex())
	}

	// Notify recipient (if sender is buyer, notify solver, and vice versa)
	var recipientID primitive.ObjectID
	if message.SenderRole == "buyer" {
		recipientID = chat.SolverID
		fmt.Printf("[SendMessage] Sending notification to solver: %s\n", recipientID.Hex())
		go CreateSolverNotification(
			recipientID,
			models.NotifTypeBuyerMessage,
			"New Message from Buyer",
			"You have a new message regarding your assignment",
			chat.AssignmentID,
			"chat",
			models.PriorityMedium,
		)
	} else {
		recipientID = chat.BuyerID
		fmt.Printf("[SendMessage] Sending notification to buyer: %s\n", recipientID.Hex())
		go CreateBuyerNotification(
			recipientID,
			models.NotifTypeChatMessage,
			"New Message from Solver",
			"You have a new message about your assignment",
			chat.AssignmentID,
			"chat",
			models.PriorityMedium,
		)
	}

	fmt.Printf("[SendMessage] Request completed successfully\n")
	c.JSON(http.StatusOK, gin.H{
		"message":           "Message sent successfully",
		"notification_sent": true,
	})
}

// GET /api/chat/:id
func GetChat(c *gin.Context) {
	chatID := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(chatID)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	chatCollection := config.DB.Collection("chats")
	var chat models.Chat
	err := chatCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&chat)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found"})
		return
	}

	c.JSON(http.StatusOK, chat)
}

// PUT /api/chat/:id/price
func NegotiatePrice(c *gin.Context) {
	chatID := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(chatID)

	var priceReq struct {
		AgreedPrice    float64   `json:"agreedPrice"`
		AgreedDeadline time.Time `json:"agreedDeadline"`
	}
	if err := c.ShouldBindJSON(&priceReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	chatCollection := config.DB.Collection("chats")
	_, err := chatCollection.UpdateOne(
		ctx,
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{
			"agreedPrice":    priceReq.AgreedPrice,
			"agreedDeadline": priceReq.AgreedDeadline,
			"updatedAt":      time.Now(),
		}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update price"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Price negotiated successfully"})
}

// POST /api/chat/fix-messages - Fix chats with null messages array (Migration helper)
func FixChatMessages(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	chatCollection := config.DB.Collection("chats")

	// Update all chats where messages is null
	result, err := chatCollection.UpdateMany(
		ctx,
		bson.M{"messages": nil},
		bson.M{"$set": bson.M{"messages": []models.Message{}}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fix chats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Chats fixed successfully",
		"fixed_count": result.ModifiedCount,
	})
}
