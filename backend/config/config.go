package config

import (
	"context"
	"log"
	"os"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database

func ConnectDB() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	uri := os.Getenv("MONGO_URI")
	if os.Getenv("PORT") != "" {
		hasMongo := "absent"
		if os.Getenv("MONGO_URI") != "" {
			hasMongo = "present"
		}
		log.Printf("Env check: PORT=%s, GIN_MODE=%s, MONGO_URI=%s", os.Getenv("PORT"), os.Getenv("GIN_MODE"), hasMongo)
	}
	if (os.Getenv("GIN_MODE") == "release" || os.Getenv("PORT") != "") && uri == "" {
		log.Fatal("MONGODB_URI is not set; configure it in your deployment environment")
	}
	if uri == "" {
		uri = "mongodb://localhost:27017"
	}

	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	err = client.Ping(context.TODO(), nil)
	if err != nil {
		log.Fatal(err)
	}

	DB = client.Database("artist-blend")
	log.Println("Connected to MongoDB!")
}
