package main

import (
	
	"log"


	"github.com/gin-gonic/gin"

	"github.com/Git-HimanshuRathi/artist-blend/backend/config"
)

func main() {
	// Set Gin to release mode
	gin.SetMode(gin.ReleaseMode)

	// Connect to MongoDB
	config.ConnectDB()

	router := gin.Default()

	// Configure trusted proxies
	router.SetTrustedProxies([]string{"127.0.0.1"})

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello from ArtistBlend Backend with MongoDB!",
		})
	})

	// Add error handling for server startup
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}