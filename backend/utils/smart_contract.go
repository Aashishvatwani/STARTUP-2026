package utils

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"os"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Contract ABI for AssignmentEscrow (deployed on Sepolia at 0x05227752c8d799c25f064d7a2364531c555b4d72)
const contractABI = `[
	{
		"inputs": [{"internalType": "string","name": "_assignmentId","type": "string"},{"internalType": "address","name": "_solver","type": "address"}],
		"name": "createAssignment",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [{"internalType": "string","name": "_assignmentId","type": "string"}],
		"name": "markCompleted",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [{"internalType": "string","name": "_assignmentId","type": "string"}],
		"name": "releasePayment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [{"internalType": "string","name": "_assignmentId","type": "string"}],
		"name": "refundPayment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [{"internalType": "string","name": "_assignmentId","type": "string"}],
		"name": "getAssignment",
		"outputs": [{"internalType": "string","name": "id","type": "string"},{"internalType": "address","name": "buyer","type": "address"},{"internalType": "address","name": "solver","type": "address"},{"internalType": "uint256","name": "amount","type": "uint256"},{"internalType": "string","name": "status","type": "string"}],
		"stateMutability": "view",
		"type": "function"
	}
]`

// CreateAssignmentEscrow creates an escrow on-chain by calling createAssignment
// amountInWei should be a decimal string representing wei (e.g., "1000000000000000000" for 1 ETH)
func CreateAssignmentEscrow(assignmentID string, buyerAddress string, solverAddress string, amountInWei string) (string, error) {
	contractAddress := os.Getenv("SMART_CONTRACT_ADDRESS")
	providerURL := os.Getenv("ETH_PROVIDER_URL")
	privateKeyHex := os.Getenv("PLATFORM_PRIVATE_KEY")

	if contractAddress == "" || providerURL == "" || privateKeyHex == "" {
		return "", fmt.Errorf("missing env vars: SMART_CONTRACT_ADDRESS, ETH_PROVIDER_URL, or PLATFORM_PRIVATE_KEY")
	}

	client, err := ethclient.Dial(providerURL)
	if err != nil {
		return "", fmt.Errorf("failed to connect to Ethereum node: %w", err)
	}
	defer client.Close()

	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return "", fmt.Errorf("invalid private key: %w", err)
	}

	contractAddr := common.HexToAddress(contractAddress)
	solverAddr := common.HexToAddress(solverAddress)

	parsedABI, err := abi.JSON(strings.NewReader(contractABI))
	if err != nil {
		return "", fmt.Errorf("failed to parse ABI: %w", err)
	}

	// Pack the method call
	data, err := parsedABI.Pack("createAssignment", assignmentID, solverAddr)
	if err != nil {
		return "", fmt.Errorf("failed to pack createAssignment: %w", err)
	}

	// Parse value (wei)
	value := new(big.Int)
	value.SetString(amountInWei, 10)

	publicKey := privateKey.Public()
	publicKeyECDSA, _ := publicKey.(*ecdsa.PublicKey)
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)

	nonce, err := client.PendingNonceAt(context.Background(), fromAddress)
	if err != nil {
		return "", fmt.Errorf("failed to get nonce: %w", err)
	}

	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		return "", fmt.Errorf("failed to get gas price: %w", err)
	}

	chainID, err := client.NetworkID(context.Background())
	if err != nil {
		return "", fmt.Errorf("failed to get chain ID: %w", err)
	}

	// Estimate gas
	gasLimit, err := client.EstimateGas(context.Background(), ethereum.CallMsg{
		From:  fromAddress,
		To:    &contractAddr,
		Value: value,
		Data:  data,
	})
	if err != nil {
		return "", fmt.Errorf("failed to estimate gas: %w", err)
	}

	tx := types.NewTransaction(nonce, contractAddr, value, gasLimit, gasPrice, data)
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign tx: %w", err)
	}

	err = client.SendTransaction(context.Background(), signedTx)
	if err != nil {
		return "", fmt.Errorf("failed to send tx: %w", err)
	}

	return signedTx.Hash().Hex(), nil
}

// MarkAssignmentComplete marks an assignment complete on-chain (calls markCompleted)
func MarkAssignmentComplete(assignmentID string, solverAddress string) (string, error) {
	// For now we assume platform calls this; adjust as needed if solver should call it
	return sendContractTransaction("markCompleted", assignmentID)
}

// ReleaseEscrowPayment releases escrowed funds to solver and platform
func ReleaseEscrowPayment(assignmentID string, buyerAddress string, solverAddress string) (string, error) {
	return sendContractTransaction("releasePayment", assignmentID)
}

// RefundEscrowPayment refunds payment back to buyer
func RefundEscrowPayment(assignmentID string, buyerAddress string) (string, error) {
	return sendContractTransaction("refundPayment", assignmentID)
}

// GetEscrowStatus retrieves assignment details from blockchain
func GetEscrowStatus(assignmentID string) (map[string]interface{}, error) {
	contractAddress := os.Getenv("SMART_CONTRACT_ADDRESS")
	providerURL := os.Getenv("ETH_PROVIDER_URL")

	if contractAddress == "" || providerURL == "" {
		return nil, fmt.Errorf("missing SMART_CONTRACT_ADDRESS or ETH_PROVIDER_URL")
	}

	client, err := ethclient.Dial(providerURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	parsedABI, err := abi.JSON(strings.NewReader(contractABI))
	if err != nil {
		return nil, fmt.Errorf("failed to parse ABI: %w", err)
	}

	contractAddr := common.HexToAddress(contractAddress)
	data, err := parsedABI.Pack("getAssignment", assignmentID)
	if err != nil {
		return nil, fmt.Errorf("failed to pack getAssignment: %w", err)
	}

	result, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &contractAddr,
		Data: data,
	}, nil)
	if err != nil {
		return nil, fmt.Errorf("contract call failed: %w", err)
	}

	// Unpack using explicit types matching Solidity output order
	unpacked, err := parsedABI.Unpack("getAssignment", result)
	if err != nil {
		return nil, fmt.Errorf("failed to unpack result: %w", err)
	}

	// Solidity returns: (string id, address buyer, address solver, uint256 amount, string status)
	if len(unpacked) != 5 {
		return nil, fmt.Errorf("unexpected return value count: %d", len(unpacked))
	}

	id := unpacked[0].(string)
	buyer := unpacked[1].(common.Address)
	solver := unpacked[2].(common.Address)
	amount := unpacked[3].(*big.Int)
	status := unpacked[4].(string)

	return map[string]interface{}{
		"id":     id,
		"buyer":  buyer.Hex(),
		"solver": solver.Hex(),
		"amount": amount.String(),
		"status": status,
	}, nil
}

// sendContractTransaction is a helper to send a transaction to the contract for methods that take only assignmentID
func sendContractTransaction(methodName string, assignmentID string) (string, error) {
	contractAddress := os.Getenv("SMART_CONTRACT_ADDRESS")
	providerURL := os.Getenv("ETH_PROVIDER_URL")
	privateKeyHex := os.Getenv("PLATFORM_PRIVATE_KEY")

	if contractAddress == "" || providerURL == "" || privateKeyHex == "" {
		return "", fmt.Errorf("missing env vars")
	}

	client, err := ethclient.Dial(providerURL)
	if err != nil {
		return "", fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return "", fmt.Errorf("invalid private key: %w", err)
	}

	contractAddr := common.HexToAddress(contractAddress)
	parsedABI, err := abi.JSON(strings.NewReader(contractABI))
	if err != nil {
		return "", fmt.Errorf("failed to parse ABI: %w", err)
	}

	data, err := parsedABI.Pack(methodName, assignmentID)
	if err != nil {
		return "", fmt.Errorf("failed to pack %s: %w", methodName, err)
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, _ := publicKey.(*ecdsa.PublicKey)
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)

	nonce, err := client.PendingNonceAt(context.Background(), fromAddress)
	if err != nil {
		return "", fmt.Errorf("failed to get nonce: %w", err)
	}

	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		return "", fmt.Errorf("failed to get gas price: %w", err)
	}

	chainID, err := client.NetworkID(context.Background())
	if err != nil {
		return "", fmt.Errorf("failed to get chain ID: %w", err)
	}

	gasLimit, err := client.EstimateGas(context.Background(), ethereum.CallMsg{
		From: fromAddress,
		To:   &contractAddr,
		Data: data,
	})
	if err != nil {
		return "", fmt.Errorf("failed to estimate gas: %w", err)
	}

	tx := types.NewTransaction(nonce, contractAddr, big.NewInt(0), gasLimit, gasPrice, data)
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign tx: %w", err)
	}

	err = client.SendTransaction(context.Background(), signedTx)
	if err != nil {
		return "", fmt.Errorf("failed to send tx: %w", err)
	}

	return signedTx.Hash().Hex(), nil
}

// GetSmartContractAddress returns the deployed smart contract address
func GetSmartContractAddress() string {
	return os.Getenv("SMART_CONTRACT_ADDRESS")
}

// ValidateEthereumAddress checks if a string is a valid Ethereum address
func ValidateEthereumAddress(address string) bool {
	// Ethereum addresses are 42 characters (0x + 40 hex characters)
	if len(address) != 42 {
		return false
	}
	if address[:2] != "0x" {
		return false
	}
	// Check if remaining characters are valid hex
	for _, ch := range address[2:] {
		if !isHexChar(ch) {
			return false
		}
	}
	return true
}

func isHexChar(c rune) bool {
	return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')
}
