package main

import (
	"log"
	"os"
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"github.com/Git-HimanshuRathi/artist-blend/backend/handlers"
	"github.com/Git-HimanshuRathi/artist-blend/backend/config"
)

func main() {
	gin.SetMode(gin.ReleaseMode)

	config.ConnectDB()

	router := gin.Default()

	// Get frontend URL from environment variable
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:8080"
	}

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendURL, "http://127.0.0.1:5173", "http://localhost:5173", "http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:8081", "http://127.0.0.1:8081"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	router.SetTrustedProxies([]string{"127.0.0.1"})

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello from ArtistBlend Backend with MongoDB!",
		})
	})
	
	router.GET("/login", gin.WrapF(handlers.LoginHandler))
	router.GET("/callback", gin.WrapF(handlers.CallbackHandler))
	router.POST("/logout", gin.WrapF(handlers.LogoutHandler))
	
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"message": "Backend is running",
			"port": port,
		})
	})

	router.GET("/api/auth/me", gin.WrapF(handlers.MeHandler))

	router.GET("/api/search/artists", gin.WrapF(handlers.SearchArtistsHandler))
	
	router.POST("/api/playlist/generate", gin.WrapF(handlers.GeneratePlaylistHandler))
	router.POST("/api/playlist/create", gin.WrapF(handlers.CreatePlaylistHandler))

	router.GET("/api/history", gin.WrapF(handlers.ListHistoryHandler))
	router.POST("/api/history", gin.WrapF(handlers.SaveHistoryHandler))
	router.DELETE("/api/history/:id", func(c *gin.Context) {
		handlers.DeleteHistoryHandler(c.Writer, c.Request)
	})

	router.POST("/api/playlist/save", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"saved": true,
			"message": "Playlist saved (stub)",
		})
	})
	router.POST("/playlist/save", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"saved": true,
			"message": "Playlist saved (stub)",
		})
	})
	
	router.GET("/api/playlist/user", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"playlists": []string{},
			"message": "User playlists endpoint - to be implemented",
		})
	})

	// Get port from environment variable (Render uses PORT)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("Starting server on port %s", port)
	
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}
