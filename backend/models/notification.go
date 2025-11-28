package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Notification struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID      primitive.ObjectID `bson:"userId" json:"userId"` // Recipient user ID
	Type        string             `bson:"type" json:"type"`     // "assignment", "payment", "chat", "match", "urgent"
	Title       string             `bson:"title" json:"title"`
	Message     string             `bson:"message" json:"message"`
	RelatedID   primitive.ObjectID `bson:"relatedId,omitempty" json:"relatedId"` // Assignment/Payment/Chat ID
	RelatedType string             `bson:"relatedType" json:"relatedType"`       // "assignment", "payment", "chat"
	Priority    string             `bson:"priority" json:"priority"`             // "high", "medium", "low"
	IsRead      bool               `bson:"isRead" json:"isRead"`
	ReadAt      time.Time          `bson:"readAt,omitempty" json:"readAt,omitempty"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	ExpiresAt   time.Time          `bson:"expiresAt,omitempty" json:"expiresAt,omitempty"`
}

// Notification types for buyers
const (
	NotifTypeSolverMatched       = "solver_matched"       // Top solver found for assignment
	NotifTypeAssignmentAccepted  = "assignment_accepted"  // Solver accepted assignment
	NotifTypeChatMessage         = "chat_message"         // New chat message
	NotifTypePaymentConfirmed    = "payment_confirmed"    // Payment successful
	NotifTypeAssignmentDelivered = "assignment_delivered" // Solver submitted work
	NotifTypeAssignmentCompleted = "assignment_completed" // Assignment marked complete
)

// Notification types for solvers
const (
	NotifTypeNewAssignment       = "new_assignment"       // New assignment posted nearby
	NotifTypeAssignmentUrgent    = "assignment_urgent"    // Urgent assignment matching skills
	NotifTypePaymentReceived     = "payment_received"     // Payment received
	NotifTypeBuyerMessage        = "buyer_message"        // New message from buyer
	NotifTypeAssignmentCancelled = "assignment_cancelled" // Buyer cancelled assignment
	NotifTypeRatingReceived      = "rating_received"      // Received rating from buyer
)

// Priority levels
const (
	PriorityHigh   = "high"
	PriorityMedium = "medium"
	PriorityLow    = "low"
)
