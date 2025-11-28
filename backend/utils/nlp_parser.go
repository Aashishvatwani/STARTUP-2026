package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// NLPParseRequest is the request body for the NLP service
type NLPParseRequest struct {
	Text   string `json:"text"`
	UserID string `json:"user_id,omitempty"`
}

// NLPParseResponse is the response from the NLP service
type NLPParseResponse struct {
	Type           string                 `json:"type"`
	Topic          string                 `json:"topic"`
	Domain         string                 `json:"domain"`
	Pages          int                    `json:"pages"`
	Deadline       string                 `json:"deadline"`
	Urgency        string                 `json:"urgency"`
	SkillsRequired []string               `json:"skills_required"`
	EstimatedPrice float64                `json:"estimated_price"`
	RawText        string                 `json:"raw_text"`
	RawEntities    map[string]interface{} `json:"raw_entities"`
	Message        string                 `json:"message,omitempty"`
}

// ParseAssignmentText calls the Python NLP service to extract skills from assignment text
func ParseAssignmentText(text string) []string {
	// Try to call NLP service, fallback to simple keyword extraction if it fails
	nlpResponse, err := CallNLPService(text, "")
	if err != nil {
		// Fallback to simple keyword extraction
		return simpleKeywordExtraction(text)
	}

	// Return skills extracted by NLP service
	if len(nlpResponse.SkillsRequired) > 0 {
		return nlpResponse.SkillsRequired
	}

	// If no skills found by NLP, use fallback
	return simpleKeywordExtraction(text)
}

// CallNLPService calls the Python FastAPI NLP service for advanced parsing
func CallNLPService(text string, userID string) (*NLPParseResponse, error) {
	// Get NLP service URL from environment (default to localhost)
	nlpServiceURL := os.Getenv("NLP_SERVICE_URL")
	if nlpServiceURL == "" {
		nlpServiceURL = "http://localhost:8000"
	}

	// Prepare request
	reqBody := NLPParseRequest{
		Text:   text,
		UserID: userID,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", nlpServiceURL+"/nlp/parse", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	// Send request with timeout
	client := &http.Client{
		Timeout: 50 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call NLP service: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("NLP service returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var nlpResponse NLPParseResponse
	if err := json.Unmarshal(body, &nlpResponse); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &nlpResponse, nil
}

// simpleKeywordExtraction is a fallback function for basic keyword extraction
func simpleKeywordExtraction(text string) []string {
	keywords := []string{"python", "ml", "ai", "blockchain", "database", "golang", "react", "cloud", "aws", "docker",
		"machine learning", "deep learning", "data science", "computer vision", "nlp", "natural language processing"}
	found := []string{}

	lower := strings.ToLower(text)
	for _, kw := range keywords {
		if strings.Contains(lower, kw) {
			// Avoid duplicates
			if !stringInSlice(kw, found) {
				found = append(found, kw)
			}
		}
	}
	return found
}

func stringInSlice(a string, list []string) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}
