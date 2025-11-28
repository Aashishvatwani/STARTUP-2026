package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Chat struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	AssignmentID   primitive.ObjectID `bson:"assignmentId" json:"assignmentId"`
	BuyerID        primitive.ObjectID `bson:"buyerId" json:"buyerId"`
	SolverID       primitive.ObjectID `bson:"solverId" json:"solverId"`
	Messages       []Message          `bson:"messages" json:"messages"`
	AgreedPrice    float64            `bson:"agreedPrice" json:"agreedPrice"`
	AgreedDeadline time.Time          `bson:"agreedDeadline" json:"agreedDeadline"`
	Status         string             `bson:"status" json:"status"` // "active", "closed", "completed"
	CreatedAt      time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type Message struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	SenderID   primitive.ObjectID `bson:"senderId" json:"senderId"`
	SenderRole string             `bson:"senderRole" json:"senderRole"` // "buyer" or "solver"
	Content    string             `bson:"content" json:"content"`
	Timestamp  time.Time          `bson:"timestamp" json:"timestamp"`
}
