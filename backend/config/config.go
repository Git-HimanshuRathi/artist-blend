package config

import (
	"context"
	"log"
	"os"
	"strings"

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
	if uri == "" {
		uri = os.Getenv("MONGODB_URI")
	}
	if os.Getenv("PORT") != "" {
		hasMongo := "absent"
		if os.Getenv("MONGO_URI") != "" || os.Getenv("MONGODB_URI") != "" {
			hasMongo = "present"
		}
		log.Printf("Env check: PORT=%s, GIN_MODE=%s, MONGO(_DB)_URI=%s", os.Getenv("PORT"), os.Getenv("GIN_MODE"), hasMongo)
	}
	if (os.Getenv("GIN_MODE") == "release" || os.Getenv("PORT") != "") && uri == "" {
		log.Fatal("Mongo URI is not set; set MONGO_URI or MONGODB_URI in your environment")
	}
	if uri == "" {
		uri = "mongodb://localhost:27017"
	}

	redacted := redactMongoURI(uri)
	log.Printf("Connecting to MongoDB at %s", redacted)

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

func redactMongoURI(uri string) string {
	schemeSep := "://"
	atIdx := strings.Index(uri, "@")
	schemeIdx := strings.Index(uri, schemeSep)
	if schemeIdx >= 0 && atIdx > schemeIdx {
		return uri[:schemeIdx+len(schemeSep)] + "****:****@" + uri[atIdx+1:]
	}
	return strings.ReplaceAll(strings.ReplaceAll(uri, "password=", "password=****"), "pwd=", "pwd=****")
}
