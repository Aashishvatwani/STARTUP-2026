package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name     string             `json:"name" bson:"name"`
	Email    string             `json:"email" bson:"email"`
	Password string             `json:"password,omitempty" bson:"password"`
	Role     string             `json:"role" bson:"role"` // "buyer" or "solver"
	Skills   []string           `json:"skills" bson:"skills"`
	About    string             `json:"about" bson:"about"`

	AvgRating     float64  `json:"avg_rating" bson:"avgRating"`
	AvgResponse   float64  `json:"avg_response" bson:"avgResponse"` // minutes
	AvgSpeed      float64  `json:"avg_speed" bson:"avgSpeed"`       // hours
	PricePerJob   float64  `json:"price_per_job" bson:"pricePerJob"`
	Location      Location `json:"location" bson:"location"`
	Speed         float64  `json:"speed" bson:"speed"` // avg time per assignment in hours
	CreatedAt     int64    `json:"createdAt" bson:"createdAt"`
	CompletedJobs int      `json:"completedJobs" bson:"completedJobs"`
	Reliability   float64  `json:"reliability" bson:"reliability"` // 0-1 score
	// EthereumAddress stores the user's crypto address for on-chain escrow and payouts
	EthereumAddress string `json:"ethereumAddress,omitempty" bson:"ethereumAddress"`

	// Payout details for fiat payouts (Razorpay payouts / bank)
	Payout struct {
		AccountHolderName string `json:"accountHolderName,omitempty" bson:"accountHolderName,omitempty"`
		AccountNumber     string `json:"accountNumber,omitempty" bson:"accountNumber,omitempty"`
		IFSC              string `json:"ifsc,omitempty" bson:"ifsc,omitempty"`
		BankName          string `json:"bankName,omitempty" bson:"bankName,omitempty"`
		UPI               string `json:"upi,omitempty" bson:"upi,omitempty"` // UPI/VPA
	} `json:"payout,omitempty" bson:"payout,omitempty"`
}

type Location struct {
	Latitude  float64 `json:"latitude" bson:"latitude"`
	Longitude float64 `json:"longitude" bson:"longitude"`
}
