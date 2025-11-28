package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Assignment struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID      primitive.ObjectID `bson:"userId" json:"userId"`
	Title       string             `bson:"title" json:"title"`
	Description string             `bson:"description" json:"description"`
	Pages       int                `bson:"pages" json:"pages"`
	Urgency     string             `bson:"urgency" json:"urgency"`
	Location    LocationCoords     `bson:"location" json:"location"`
	Price       float64            `bson:"price" json:"price"`
	Status      string             `bson:"status" json:"status"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	Lat         float64            `bson:"lat" json:"lat"`
	Lng         float64            `bson:"lng" json:"lng"`
	Skills      []string           `bson:"skills" json:"skills"`
	Deadline    time.Time          `bson:"deadline" json:"deadline"`
	BidAmount   float64            `bson:"bidAmount" json:"bidAmount"`
}

type LocationCoords struct {
	Latitude  float64 `json:"latitude" bson:"latitude"`
	Longitude float64 `json:"longitude" bson:"longitude"`
}
