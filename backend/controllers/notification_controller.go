package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/Aashishvatwani/homeworld/config"
	"github.com/Aashishvatwani/homeworld/models"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// POST /api/notifications/send - Send notification to user
func SendNotification(c *gin.Context) {
	var notification models.Notification
	if err := c.ShouldBindJSON(&notification); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	notification.ID = primitive.NewObjectID()
	notification.IsRead = false
	notification.CreatedAt = time.Now()

	// Set expiry (30 days default)
	if notification.ExpiresAt.IsZero() {
		notification.ExpiresAt = time.Now().AddDate(0, 0, 30)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	notificationCollection := config.DB.Collection("notifications")
	result, err := notificationCollection.InsertOne(ctx, notification)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Notification sent successfully",
		"id":      result.InsertedID,
	})
}

// GET /api/notifications/:userId - Get all notifications for a user
func GetNotifications(c *gin.Context) {
	userID := c.Param("userId")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	notificationCollection := config.DB.Collection("notifications")
	// Get query parameters for filtering
	onlyUnread := c.Query("unread") == "true"

	filter := bson.M{"userId": objID}
	if onlyUnread {
		filter["isRead"] = false
	}

	// Sort by created date (newest first)
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := notificationCollection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}
	defer cursor.Close(ctx)

	var notifications []models.Notification
	if err := cursor.All(ctx, &notifications); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding notifications"})
		return
	}

	// Count unread
	unreadCount, _ := notificationCollection.CountDocuments(ctx, bson.M{
		"userId": objID,
		"isRead": false,
	})

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"unread_count":  unreadCount,
		"total":         len(notifications),
	})
}

// PUT /api/notifications/:id/read - Mark notification as read
func MarkNotificationRead(c *gin.Context) {
	notifID := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(notifID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	notificationCollection := config.DB.Collection("notifications")
	update := bson.M{
		"$set": bson.M{
			"isRead": true,
			"readAt": time.Now(),
		},
	}

	result, err := notificationCollection.UpdateOne(ctx, bson.M{"_id": objID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Notification marked as read",
		"modified_count": result.ModifiedCount,
	})
}

// PUT /api/notifications/:userId/read-all - Mark all notifications as read
func MarkAllNotificationsRead(c *gin.Context) {
	userID := c.Param("userId")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	notificationCollection := config.DB.Collection("notifications")
	update := bson.M{
		"$set": bson.M{
			"isRead": true,
			"readAt": time.Now(),
		},
	}

	result, err := notificationCollection.UpdateMany(
		ctx,
		bson.M{"userId": objID, "isRead": false},
		update,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark all as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "All notifications marked as read",
		"modified_count": result.ModifiedCount,
	})
}

// DELETE /api/notifications/:id - Delete notification
func DeleteNotification(c *gin.Context) {
	notifID := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(notifID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	notificationCollection := config.DB.Collection("notifications")
	result, err := notificationCollection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Notification deleted",
		"deleted_count": result.DeletedCount,
	})
}

// Helper function: Create notification for buyer
func CreateBuyerNotification(userID primitive.ObjectID, notifType, title, message string, relatedID primitive.ObjectID, relatedType, priority string) error {
	notification := models.Notification{
		ID:          primitive.NewObjectID(),
		UserID:      userID,
		Type:        notifType,
		Title:       title,
		Message:     message,
		RelatedID:   relatedID,
		RelatedType: relatedType,
		Priority:    priority,
		IsRead:      false,
		CreatedAt:   time.Now(),
		ExpiresAt:   time.Now().AddDate(0, 0, 30),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	notificationCollection := config.DB.Collection("notifications")
	_, err := notificationCollection.InsertOne(ctx, notification)
	return err
}

// Helper function: Create notification for solver
func CreateSolverNotification(userID primitive.ObjectID, notifType, title, message string, relatedID primitive.ObjectID, relatedType, priority string) error {
	notification := models.Notification{
		ID:          primitive.NewObjectID(),
		UserID:      userID,
		Type:        notifType,
		Title:       title,
		Message:     message,
		RelatedID:   relatedID,
		RelatedType: relatedType,
		Priority:    priority,
		IsRead:      false,
		CreatedAt:   time.Now(),
		ExpiresAt:   time.Now().AddDate(0, 0, 30),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	notificationCollection := config.DB.Collection("notifications")
	_, err := notificationCollection.InsertOne(ctx, notification)
	return err
}

// Helper function: Notify top solvers about new assignment
func NotifyTopSolversAboutAssignment(assignmentID primitive.ObjectID, solverIDs []primitive.ObjectID, assignmentTitle string, isUrgent bool) {
	priority := models.PriorityMedium
	if isUrgent {
		priority = models.PriorityHigh
	}

	title := "New Assignment Available"
	message := "A new assignment matching your skills: " + assignmentTitle

	if isUrgent {
		title = "🔥 Urgent Assignment!"
		message = "Urgent assignment nearby: " + assignmentTitle
	}

	for _, solverID := range solverIDs {
		go CreateSolverNotification(
			solverID,
			models.NotifTypeNewAssignment,
			title,
			message,
			assignmentID,
			"assignment",
			priority,
		)
	}
}

// Helper function: Notify buyer about top solvers
func NotifyBuyerAboutSolvers(buyerID primitive.ObjectID, assignmentID primitive.ObjectID, solverCount int) {
	title := "Top Solvers Found!"
	message := "We found top solvers matching your assignment requirements"

	go CreateBuyerNotification(
		buyerID,
		models.NotifTypeSolverMatched,
		title,
		message,
		assignmentID,
		"assignment",
		models.PriorityMedium,
	)
}
