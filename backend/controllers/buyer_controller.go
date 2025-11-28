package controllers

import (
	"context"
	"net/http"
	"sort"
	"time"

	"github.com/Aashishvatwani/homeworld/config"
	"github.com/Aashishvatwani/homeworld/models"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

type BuyerRank struct {
	Buyer models.User `json:"buyer"`
	Score float64     `json:"score"`
}

// GET /api/buyers/top
func GetTopBuyers(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	buyerCollection := config.DB.Collection("users")
	cursor, err := buyerCollection.Find(ctx, bson.M{"role": "buyer"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch buyers"})
		return
	}

	var buyers []models.User
	cursor.All(ctx, &buyers)

	var ranked []BuyerRank
	for _, buyer := range buyers {
		offer := buyer.PricePerJob
		urgency := buyer.AvgResponse
		reliability := buyer.AvgRating

		score := (offer*0.5 + (1/(urgency+1))*0.2 + reliability*0.3)
		ranked = append(ranked, BuyerRank{Buyer: buyer, Score: score})
	}

	sort.Slice(ranked, func(i, j int) bool {
		return ranked[i].Score > ranked[j].Score
	})

	if len(ranked) > 10 {
		ranked = ranked[:10]
	}

	c.JSON(http.StatusOK, gin.H{"top_buyers": ranked})
}
