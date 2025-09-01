package main

import (
	"fmt"
	"net/http"
	"github.com/gin-gonic/gin"

	"github.com/Git-HimanshuRathi/artist-blend-.git/backend/config"
)

func main() {
	config.ConnectDB()

	router := gin.Default()

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
            "message": "Hello from ArtistBlend Backend with MongoDB!",
        })
	})

	router.run(":8080")
}