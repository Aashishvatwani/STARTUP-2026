package utils

import "golang.org/x/crypto/bcrypt"

// HashPassword takes a plain text password and returns a bcrypt-hashed string.
// It’s what you store in MongoDB (never the plain password).
func HashPassword(password string) (string, error) {
	// 14 is the bcrypt cost factor — secure yet still performant.
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// CheckPassword compares a hashed password (from DB) with a plain text password (user input).
// Returns true if they match, false otherwise.
func CheckPassword(hashed, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashed), []byte(password))
	return err == nil
}
