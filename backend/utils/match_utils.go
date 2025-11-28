package utils

func CalculateSkillMatch(a, b []string) float64 {
	if len(a) == 0 || len(b) == 0 {
		return 0
	}

	matchCount := 0
	for _, skillA := range a {
		for _, skillB := range b {
			if skillA == skillB {
				matchCount++
			}
		}
	}
	return float64(matchCount) / float64(len(a))
}

// Normalize inversely proportional values like price, time, etc.
func NormalizeInverse(value, max float64) float64 {
	if value <= 0 {
		return 0
	}
	score := 1 - (value / max)
	if score < 0 {
		score = 0
	}
	return score
}
