package main

import (
	"github.com/Git-HimanshuRathi/artist-blend/backend/handlers"
    "log"
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"github.com/Git-HimanshuRathi/artist-blend/backend/config"
)

func main() {
	// Set Gin to release mode
	gin.SetMode(gin.ReleaseMode)

	// Connect to MongoDB
	config.ConnectDB()

	router := gin.Default()

	// Configure CORS for frontend
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Configure trusted proxies
	router.SetTrustedProxies([]string{"127.0.0.1"})

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello from ArtistBlend Backend with MongoDB!",
		})
	})
	
	// Authentication routes
	router.GET("/login", gin.WrapF(handlers.LoginHandler))
	router.GET("/callback", gin.WrapF(handlers.CallbackHandler))
	
	// API routes for frontend
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"message": "Backend is running",
		})
	})
	
	// Placeholder routes for frontend integration
	router.POST("/api/playlist/generate", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Playlist generation endpoint - to be implemented",
		})
	})
	
	router.GET("/api/playlist/user", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"playlists": []string{},
			"message": "User playlists endpoint - to be implemented",
		})
	})


	// Add error handling for server startup with HTTP (Spotify allows HTTP for 127.0.0.1)
	if err := router.Run(":8000"); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}
